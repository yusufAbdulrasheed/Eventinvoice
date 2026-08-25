import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Generate signed JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/register
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  const { _id, name, email, plan, bankDetails, createdAt } = req.user;
  res.json({ _id, name, email, plan, bankDetails, createdAt });
};

// PATCH /api/auth/me
export const updateMe = async (req, res) => {
  const { name, email } = req.body;

  if (!name && !email) {
    return res.status(400).json({ message: "Nothing to update" });
  }
  if ((name && typeof name !== "string") || (email && typeof email !== "string")) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }
    }

    if (name) req.user.name = name;
    if (email) req.user.email = email;
    await req.user.save();

    const { _id, name: updatedName, email: updatedEmail, plan, bankDetails, createdAt } = req.user;
    res.json({ _id, name: updatedName, email: updatedEmail, plan, bankDetails, createdAt });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /api/auth/bank-details — shown on invoices, set from Settings → Billing
export const updateBankDetails = async (req, res) => {
  const { bankName, accountName, accountNumber } = req.body;

  if ([bankName, accountName, accountNumber].some((v) => v !== undefined && typeof v !== "string")) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    req.user.bankDetails = {
      bankName: bankName ?? req.user.bankDetails?.bankName ?? "",
      accountName: accountName ?? req.user.bankDetails?.accountName ?? "",
      accountNumber: accountNumber ?? req.user.bankDetails?.accountNumber ?? "",
    };
    await req.user.save();

    const { _id, name, email, plan, bankDetails, createdAt } = req.user;
    res.json({ _id, name, email, plan, bankDetails, createdAt });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /api/auth/password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new password are required" });
  }
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  try {
    const matches = await req.user.matchPassword(currentPassword);
    if (!matches) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    req.user.password = newPassword; // pre-save hook rehashes
    await req.user.save();

    res.json({ message: "Password updated" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
