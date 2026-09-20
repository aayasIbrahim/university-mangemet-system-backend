import { FeeType, PaymentMethod } from "../../../generated/prisma/enums";

export interface IInvoiceItemInput {
  feeType: FeeType;
  description?: string;
  amount: number;
}

export interface ICreateInvoicePayload {
  studentId: string;
  semesterId: string;
  items: IInvoiceItemInput[];
  currency: string;
  dueDate: Date;
}
export interface IManualPaymentInput {
  amountPaid: number; 
  paymentMethod: PaymentMethod;
  transactionId: string;
  remarks?: string;
}