import crypto from "node:crypto";
import httpStatus from "http-status";
import Stripe from "stripe";
import {
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import config from "../../config";
import { AppError } from "../../utils/AppError";
import {
  ICreateInvoicePayload,
  IManualPaymentInput,
} from "./payment.interface";
import { RequestUser } from "../../middleware/checkAuth";
import { IQuery } from "../../interfaces";
import { InvoiceWhereInput } from "../../../generated/prisma/models";
import { handleInvoicePayment } from "./payment.utlis";

const createInvoice = async (
  payload: ICreateInvoicePayload,
  createdUserInvoice: RequestUser,
) => {
  const [student, semester] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { id: payload.studentId },
      select: { id: true },
    }),
    prisma.semester.findUnique({
      where: { id: payload.semesterId },
      select: { id: true },
    }),
  ]);
  if (!student)
    throw new AppError(httpStatus.NOT_FOUND, "Student profile not found.");
  if (!semester)
    throw new AppError(httpStatus.NOT_FOUND, "Semester not found.");

  const totalAmount = payload.items.reduce(
    (total, item) => total + item.amount,
    0,
  );

  return prisma.invoice.create({
    data: {
      studentId: payload.studentId,
      semesterId: payload.semesterId,
      totalAmount,
      dueAmount: totalAmount,
      dueDate: payload.dueDate,
      currency: payload.currency.toLowerCase(),
      invoiceNo: `INV-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      items: { create: payload.items },
      createdById: createdUserInvoice.userId,
      createdByRole: createdUserInvoice.role,
    },
    include: { items: true },
  });
};

const createCheckoutSession = async (
  invoiceId: string,
  student: RequestUser,
) => {
  const studentId = student.userId as string;
  if (!stripe)
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Stripe payment is not configured.",
    );
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, studentId },
    include: {
      items: true,
      student: { include: { user: { select: { email: true } } } },
    },
  });
  if (!invoice) throw new AppError(httpStatus.NOT_FOUND, "Invoice not found.");
  if (invoice.status === PaymentStatus.PAID) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This invoice has already been paid.",
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: invoice.id,
    customer_email: invoice.student.user.email,
    line_items: invoice.items.map((item) => ({
      quantity: 1,
      price_data: {
        currency: invoice.currency,
        unit_amount: item.amount,
        product_data: {
          name: item.description || item.feeType,
          metadata: { invoiceNo: invoice.invoiceNo },
        },
      },
    })),
    metadata: { invoiceId: invoice.id, studentId },
    success_url:
      config.stripe_success_url ||
      `${config.frontend_url}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:
      config.stripe_cancel_url || `${config.frontend_url}/payments/cancelled`,
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { stripeCheckoutId: session.id },
  });
  if (!session.url) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create Stripe checkout session.",
    );
  }
  return { sessionId: session.id, paymentUrl: session.url };
};

const getMyInvoices = async (userId: string, query: IQuery) => {
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: InvoiceWhereInput[] = [];

  andConditions.push({ studentId: userId });

  if (query.searchTerm) {
    andConditions.push({
      invoiceNo: {
        contains: String(query.searchTerm).trim(),
        mode: "insensitive",
      },
    });
  }
  if (query.status) {
    andConditions.push({ status: query.status as PaymentStatus });
  }

  if (query.semesterId) {
    andConditions.push({ semesterId: String(query.semesterId) });
  }

  const where: InvoiceWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        semester: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          select: {
            id: true,
            feeType: true,
            description: true,
            amount: true,
          },
        },
        payments: {
          select: {
            id: true,
            receiptNo: true,
            amountPaid: true,
            paymentMethod: true,
            transactionId: true,
            paidAt: true,
          },
          orderBy: { paidAt: "desc" },
        },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  const formattedData = data.map((invoice) => ({
    ...invoice,
    totalAmount: invoice.totalAmount / 100,
    paidAmount: invoice.paidAmount / 100,
    dueAmount: invoice.dueAmount / 100,
    items: invoice.items.map((item) => ({
      ...item,
      amount: item.amount / 100,
    })),
    payments: invoice.payments.map((payment) => ({
      ...payment,
      amountPaid: payment.amountPaid / 100,
    })),
  }));

  return {
    data: formattedData,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
const getAllInvoices = async (query: IQuery) => {
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: InvoiceWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      invoiceNo: {
        contains: String(query.searchTerm).trim(),
        mode: "insensitive",
      },
    });
  }

  if (query.status) {
    andConditions.push({ status: query.status as PaymentStatus });
  }

  if (query.semesterId) {
    andConditions.push({ semesterId: String(query.semesterId) });
  }

  if (query.studentId) {
    andConditions.push({ studentId: String(query.studentId) });
  }

  const where: InvoiceWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder } as any,
      include: {
        semester: {
          select: {
            id: true,
            name: true,
          },
        },
        student: {
          select: {
            id: true,
            batch: true,
            department: true,
            semester: true,

            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        items: {
          select: {
            id: true,
            feeType: true,
            description: true,
            amount: true,
          },
        },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  const formattedData = data.map((invoice) => ({
    ...invoice,
    totalAmount: invoice.totalAmount / 100,
    paidAmount: invoice.paidAmount / 100,
    dueAmount: invoice.dueAmount / 100,
    items: invoice.items.map((item) => ({
      ...item,
      amount: item.amount / 100,
    })),
  }));

  return {
    data: formattedData,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
const getInvoiceStatus = async (invoiceId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      invoiceNo: true,
      status: true,
      totalAmount: true,
      paidAmount: true,
      dueAmount: true,
      dueDate: true,
    },
  });

  if (!invoice) {
    throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
  }

  const isFullyPaid = invoice.status === PaymentStatus.PAID;

  const isOverdue = !isFullyPaid && new Date(invoice.dueDate) < new Date();

  return {
    invoiceId: invoice.id,
    invoiceNo: invoice.invoiceNo,
    status: invoice.status,
    isPaid: isFullyPaid,
    isOverdue,
    dueDate: invoice.dueDate,
    financials: {
      totalAmountInTaka: invoice.totalAmount / 100,
      paidAmountInTaka: invoice.paidAmount / 100,
      dueAmountInTaka: invoice.dueAmount / 100,
    },
  };
};
const processManualPayment = async (
  invoiceId: string,
  payload: IManualPaymentInput,
) => {
  const amountPaidInPoisha = Math.round(payload.amountPaid * 100);
  const receiptNo = `MAN-RCPT-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
    }

    if (invoice.status === PaymentStatus.PAID) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This invoice is already fully paid",
      );
    }

    if (amountPaidInPoisha > invoice.dueAmount) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Payment amount exceeds current due amount. Max allowed: ৳${invoice.dueAmount / 100}`,
      );
    }

    const newPaidAmount = invoice.paidAmount + amountPaidInPoisha;
    const newDueAmount = invoice.dueAmount - amountPaidInPoisha;

    const nextStatus =
      newDueAmount === 0 ? PaymentStatus.PAID : PaymentStatus.PARTIAL;

    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status: nextStatus,
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
      },
    });

    const payment = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        receiptNo,
        amountPaid: amountPaidInPoisha,
        paymentMethod: payload.paymentMethod,
        transactionId: payload.transactionId,
        remarks: payload.remarks || "Manually posted by Finance Admin",
        isVerified: true,
        paidAt: new Date(),
      },
    });

    return payment;
  });
};

const cancelInvoice = async (invoiceId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: { select: { id: true } } },
  });
  if (!invoice) throw new AppError(httpStatus.NOT_FOUND, "Invoice not found.");
  if (
    invoice.status === PaymentStatus.PAID ||
    invoice.paidAmount > 0 ||
    invoice.payments.length > 0
  ) {
    throw new AppError(
      httpStatus.CONFLICT,
      "A partially or fully paid invoice cannot be cancelled. Refund the payment instead.",
    );
  }
  if (invoice.status === PaymentStatus.CANCELED) return invoice;
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: PaymentStatus.CANCELED },
  });
};

const refundPayment = async (
  paymentId: string,
  adminId: string, // রিফান্ড কারী অ্যাডমিনের আইডি
  payload: { amountToRefund: number; reason: string },
) => {
  const refundAmountInPoisha = Math.round(payload.amountToRefund * 100);

  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true, refunds: true },
    });

    if (!payment) throw new AppError(httpStatus.NOT_FOUND, "Payment not found");

    // ১. চেক করা: ইতিমধ্যে এই পেমেন্টের বিপরীতে মোট কত রিফান্ড করা হয়েছে
    const totalAlreadyRefunded = payment.refunds
      .filter((r) => r.status === "SUCCEEDED" || r.status === "PENDING")
      .reduce((sum, r) => sum + r.amount, 0);

    if (totalAlreadyRefunded + refundAmountInPoisha > payment.amountPaid) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Total refund amount exceeds original payment",
      );
    }

    // ২. নতুন রিফান্ড রেকর্ড তৈরি (আপনার নতুন মডেল অনুযায়ী)
    const refund = await tx.refund.create({
      data: {
        paymentId,
        amount: refundAmountInPoisha,
        reason: payload.reason,
        status: "SUCCEEDED", // যদি অনলাইন হয় তবে গেটওয়ে রেসপন্স অনুযায়ী হবে
        createdById: adminId,
      },
    });

    // ৩. ইনভয়েসের ব্যালেন্স এবং ডিউ আপডেট করা
    const invoice = payment.invoice;
    const newPaidAmount = invoice.paidAmount - refundAmountInPoisha;
    const newDueAmount = invoice.dueAmount + refundAmountInPoisha;

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        status: newPaidAmount === 0 ? "REFUNDED" : "PARTIALLY_PAID",
      },
    });

    return refund;
  });
};
const handleWebhook = async (payload: Buffer, signature: string) => {
  if (!stripe) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Stripe payment is not configured.",
    );
  }

  const endpointSecret = config.stripe_webhook_secret;
  if (!endpointSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature!, endpointSecret);
  } catch (err) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid Stripe webhook signature.",
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleInvoicePayment(
        event.data.object as Stripe.Checkout.Session,
        true,
      );
      break;

    case "checkout.session.async_payment_succeeded":
      await handleInvoicePayment(
        event.data.object as Stripe.Checkout.Session,
        true,
      );
      break;

    case "checkout.session.async_payment_failed":
      await handleInvoicePayment(
        event.data.object as Stripe.Checkout.Session,
        false,
      );
      break;

    default:
      console.log(`No events matched. Unhandled event type ${event.type}.`);
      break;
  }

  return { received: true };
};

export const PaymentService = {
  createInvoice,
  createCheckoutSession,
  getMyInvoices,
  getAllInvoices,
  getInvoiceStatus,
  processManualPayment,
  cancelInvoice,
  refundPayment,
  handleWebhook,
};
