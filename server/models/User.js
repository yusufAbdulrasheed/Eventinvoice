import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    // No billing system exists yet — this just reflects that; every account
    // is "free" until a real subscription flow sets it otherwise.
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    // Shown on invoices (paper + public payment page) so clients know where
    // to send bank transfers — set from Settings → Billing.
    bankDetails: {
      bankName: { type: String, trim: true, default: "" },
      accountName: { type: String, trim: true, default: "" },
      accountNumber: { type: String, trim: true, default: "" },
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
