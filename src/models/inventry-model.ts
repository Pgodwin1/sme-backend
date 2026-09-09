import { Schema, model } from "mongoose";
import {
  IInventoryDoc,
  IInventoryItem,
  InventoryStatus,
} from "../interface/inventry-interface";

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    quantity: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    supplier: { type: String, required: true },
    reorderLevel: { type: Number, required: true, default: 0 },
    reorderQuantity: { type: Number, required: true, default: 0 },
    lastOrderedDate: { type: Date },
    lastReceivedDate: { type: Date },
    status: {
      type: String,
      enum: Object.values(InventoryStatus),
      default: InventoryStatus.IN_STOCK,
    },
  },
  { timestamps: true },
);

const inventorySchema = new Schema<IInventoryDoc>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [inventoryItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export const Inventory = model("Inventory", inventorySchema);
