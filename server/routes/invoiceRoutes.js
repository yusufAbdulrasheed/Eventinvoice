import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateStatus,
  getPaymentLink,
  sendInvoiceEmail,
} from "../controllers/invoiceController.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getInvoices)
  .post(createInvoice);

router.route("/:id")
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(deleteInvoice);

router.patch("/:id/status", updateStatus);
router.get("/:id/payment-link", getPaymentLink);
router.post("/:id/send", sendInvoiceEmail);

export default router;
