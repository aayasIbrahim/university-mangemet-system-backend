import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";

const createInvoice = catchAsync(async (req: Request, res: Response) => {
  const createdUserInvoice = req.user!;
  const payload = req.body;
  const result = await PaymentService.createInvoice(
    payload,
    createdUserInvoice,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Invoice created successfully.",
    data: result,
  });
});

const createCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const invoiceId = req.params.invoiceId as string;
    const student = req.user!;
    const result = await PaymentService.createCheckoutSession(
      invoiceId,
      student,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Stripe Checkout session created.",
      data: result,
    });
  },
);

const getMyInvoices = catchAsync(async (req: Request, res: Response) => {
  const currentStudentId = req.user!.userId;
  const query = req.query;
  const result = await PaymentService.getMyInvoices(currentStudentId, query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoices fetched successfully.",
    data: result.data,
    meta: result.meta,
  });
});

const getAllInvoices = catchAsync(async (req: Request, res: Response) => {
  // req.query থেকে ফিল্টার প্যারামিটারগুলো ক্যাচ করা হচ্ছে
  const query = req.query;

  const result = await PaymentService.getAllInvoices(query);

  // আপনার প্রজেক্টের গ্লোবাল রেসপন্স ফরম্যাট অনুযায়ী রেসপন্স পাঠানো
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Invoices fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});
const getInvoiceStatus = catchAsync(async (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  const result = await PaymentService.getInvoiceStatus(invoiceId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Invoice payment status fetched successfully',
    data: result,
  });
});
const processManualPayment = catchAsync(async (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  const payload = req.body;

  const result = await PaymentService.processManualPayment(invoiceId as string,payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Manual offline payment recorded successfully',
    data: result,
  });
});

const cancelInvoice = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.cancelInvoice(req.params.invoiceId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice cancelled successfully.",
    data: result,
  });
});

const refundPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.refundPayment(
    req.params.paymentId as string,
    req.body,
    req.user!.userId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment refund processed successfully.",
    data: result,
  });
});

const webhook = catchAsync(async (req: Request, res: Response) => {
  const event = req.body as Buffer;
  const signature = req.headers["stripe-signature"] as string;
  await PaymentService.handleWebhook(event, signature);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Webhook triggered Successfully",
    data: null,
  });
});

export const PaymentController = {
  createInvoice,
  createCheckoutSession,
  getMyInvoices,
  getAllInvoices,
  getInvoiceStatus,
  processManualPayment,
  cancelInvoice,
  refundPayment,
  webhook,
};
