import { Schema, model } from "mongoose";
import { ISaleDoc, ISaleItem, PaymentStatus } from "../interface/sale-interface";

const saleItemSchema = new Schema<ISaleItem>(
  {
    inventoryItem: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const saleSchema = new Schema<ISaleDoc>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiptNumber: { type: String, required: true },
    customerName: { type: String },
    customerPhone: { type: String },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (items: ISaleItem[]) => items.length > 0,
        message: "A sale must have at least one item.",
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      required: true,
    },
    amountPaid: { type: Number, required: true, min: 0, default: 0 },
    balanceDue: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

// A receipt number only needs to be unique per business, not globally.
saleSchema.index({ user: 1, receiptNumber: 1 }, { unique: true });
saleSchema.index({ user: 1, createdAt: -1 });

export const Sale = model("Sale", saleSchema);
