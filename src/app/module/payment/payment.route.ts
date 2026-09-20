import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateReques";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";

const router = Router();

router.post(
  "/invoices",
  auth(Role.FINANCE_ADMIN, Role.SUPER_ADMIN),
  validateRequest(PaymentValidation.createInvoice),
  PaymentController.createInvoice,
);
router.get(
  "/invoices",
  auth(Role.FINANCE_ADMIN, Role.SUPER_ADMIN),
  PaymentController.getAllInvoices,
);
router.get("/invoices/me", auth(Role.STUDENT), PaymentController.getMyInvoices);
router.get(
  "/invoices/:invoiceId/status",
  auth(Role.STUDENT, Role.FINANCE_ADMIN, Role.SUPER_ADMIN),
  PaymentController.getInvoiceStatus,
);

router.post(
  "/invoices/:invoiceId/checkout",
  auth(Role.STUDENT),
  PaymentController.createCheckoutSession,
);
router.post(
  "/invoices/:invoiceId/manual-pay",
  auth(Role.FINANCE_ADMIN, Role.SUPER_ADMIN),
  validateRequest(PaymentValidation.manualPayment),
  PaymentController.processManualPayment, //cash and bank enrty
);
router.post(
  "/invoices/:invoiceId/cancel",
  auth(Role.FINANCE_ADMIN, Role.SUPER_ADMIN),
  PaymentController.cancelInvoice,
);

router.post(
  "/payments/:paymentId/refund",
  auth(Role.FINANCE_ADMIN, Role.SUPER_ADMIN),
  validateRequest(PaymentValidation.refund),
  PaymentController.refundPayment, 
);
export const PaymentRoutes = router;

export const PaymentWebhookRoutes = Router().post(
  "/",
  PaymentController.webhook,
);
