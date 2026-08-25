import mongoose from "mongoose";

// One counter document per user, used to hand out gap-free, unique
// invoice numbers (countDocuments is unsafe: deleting an invoice and
// creating a new one would reissue an already-used number).
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // userId as string
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);
export default Counter;
