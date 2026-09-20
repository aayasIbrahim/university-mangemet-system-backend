import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { PaymentMethod, PaymentStatus } from "../../../generated/prisma/enums";
import crypto from "crypto";
export const handleInvoicePayment = async (
  session: Stripe.Checkout.Session,
  isSuccess: boolean,
) => {
  const invoiceId = session.metadata?.invoiceId || session.client_reference_id;
  if (!invoiceId) return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntentId) return;

  const isPaid = isSuccess && session.payment_status === "paid";

  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return;

    if (invoice.status === PaymentStatus.PAID) return;

    const nextStatus = isPaid ? PaymentStatus.PAID : PaymentStatus.FAILED;
    const nextPaidAmount = isPaid ? invoice.totalAmount : invoice.paidAmount;

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: nextStatus,
        paidAmount: nextPaidAmount,
        dueAmount: invoice.totalAmount - nextPaidAmount,
      },
    });

    await tx.payment.upsert({
      where: { transactionId: paymentIntentId },
      create: {
        invoiceId: invoice.id,
        receiptNo: `RCPT-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
        amountPaid: isPaid ? invoice.totalAmount : 0,
        paymentMethod: PaymentMethod.CARD,
        transactionId: paymentIntentId,
        isVerified: isPaid,
        paidAt: isPaid ? new Date() : undefined,
      },
      update: {
        isVerified: isPaid,
        paidAt: isPaid ? new Date() : undefined,
      },
    });
  });
};
