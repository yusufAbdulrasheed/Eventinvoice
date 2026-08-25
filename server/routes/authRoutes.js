import express from "express";
import { register, login, getMe, updateMe, updateBankDetails, changePassword } from "../controllers/authController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);                       // protected — needs valid JWT
router.patch("/me", protect, updateMe);                   // protected — update own profile
router.patch("/bank-details", protect, updateBankDetails); // protected — shown on invoices
router.patch("/password", protect, changePassword);        // protected — change own password

export default router;
