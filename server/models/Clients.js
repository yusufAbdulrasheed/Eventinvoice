import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // every client belongs to a user
    },
    name: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Client email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    company: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      street: { type: String, default: "" },
      city:   { type: String, default: "" },
      state:  { type: String, default: "" },
      zip:    { type: String, default: "" },
      country:{ type: String, default: "" },
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Client = mongoose.model("Client", clientSchema);
export default Client;
