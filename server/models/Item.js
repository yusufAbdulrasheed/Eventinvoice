import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // every item belongs to a user
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["rentals", "decor", "hardware"],
      required: [true, "Category is required"],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    totalStock: {
      type: Number,
      required: [true, "Total stock is required"],
      min: 0,
    },
    availableStock: {
      type: Number,
      required: true,
      min: 0,
    },
    dailyRate: {
      type: Number,
      required: [true, "Daily rate is required"],
      min: 0,
    },
    maintenanceFlag: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Available stock can never exceed total stock — clamp on every save so
// hand-edited updates (e.g. raising totalStock below the current available
// count) can't leave the two fields inconsistent.
itemSchema.pre("save", function (next) {
  if (this.availableStock > this.totalStock) {
    this.availableStock = this.totalStock;
  }
  next();
});

// Derived, not stored — recomputed from current stock levels every time.
itemSchema.virtual("status").get(function () {
  if (this.maintenanceFlag) return "pending_maintenance";
  if (this.availableStock <= 0) return "rented";
  if (this.totalStock > 0 && this.availableStock / this.totalStock < 0.15) return "low_stock";
  return "in_stock";
});

itemSchema.set("toJSON", { virtuals: true });

const Item = mongoose.model("Item", itemSchema);
export default Item;
