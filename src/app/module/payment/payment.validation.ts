import { z } from "zod";
import { FeeType, PaymentMethod } from "../../../generated/prisma/enums";

const createInvoice = z.object({
  studentId: z.string().uuid(),
  semesterId: z.string().uuid(),
  items: z.array(
    z.object({
      feeType: z.enum(FeeType),
      description: z.string().trim().max(500).optional(),
      amount: z.number().int().positive(),
    }),
  ).min(1),
  currency: z.string().length(3).default("bdt"),
  dueDate: z.coerce.date(),
});

const manualPayment = z.object({
  body: z.object({
    amountPaid: z.number().positive("Amount must be greater than 0"),
    paymentMethod: z.enum(PaymentMethod, {
      error: "Valid payment method is required",
    }),
    transactionId: z.string().trim().min(3, "Reference too short"),
    remarks: z.string().trim().max(500).optional(),
  }),
});

const refund = z.object({
  body: z.object({
    amount: z.number().positive("Refund amount must be greater than 0").optional(),
    reason: z.string().trim().max(500).optional(),
  }),
});

export const PaymentValidation = { createInvoice, manualPayment, refund };
