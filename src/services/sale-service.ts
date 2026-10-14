import mongoose, { Types } from "mongoose";
import {
  CreateSaleInput,
  ISaleDoc,
  ListSalesOptions,
  PaginatedSales,
  PaymentStatus,
  UpdateSalePaymentInput,
} from "../interface/sale-interface";
import { InventoryStatus } from "../interface/inventry-interface";
import { Sale } from "../models/sale-model";
import { Inventory } from "../models/inventry-model";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function computeInventoryStatus(quantity: number, reorderLevel: number): InventoryStatus {
  if (quantity <= 0) return InventoryStatus.OUT_OF_STOCK;
  if (reorderLevel > 0 && quantity <= reorderLevel) return InventoryStatus.LOW_STOCK;
  return InventoryStatus.IN_STOCK;
}

function generateReceiptNumber(): string {
  return `SALE-${Date.now()}`;
}

class SaleService {
  async createSale(
    userId: string | Types.ObjectId,
    input: CreateSaleInput,
  ): Promise<ISaleDoc> {
    const session = await mongoose.startSession();

    try {
      let sale!: ISaleDoc;

      await session.withTransaction(async () => {
        const inventory = await Inventory.findOne({ user: userId }).session(session);
        if (!inventory) {
          throw new Error("No inventory found for this business.");
        }

        const saleItems = input.items.map(({ inventoryItem, quantity }) => {
          if (!Number.isInteger(quantity) || quantity < 1) {
            throw new Error("Each item's quantity must be a whole number of at least 1.");
          }

          const stockItem = inventory.items.id(inventoryItem);
          if (!stockItem) {
            throw new Error(`Inventory item ${inventoryItem} not found.`);
          }
          if (stockItem.quantity < quantity) {
            throw new Error(
              `Not enough stock for "${stockItem.name}" — only ${stockItem.quantity} left.`,
            );
          }

          return {
            stockItem,
            line: {
              inventoryItem: stockItem._id,
              name: stockItem.name,
              unitPrice: stockItem.price,
              quantity,
              subtotal: stockItem.price * quantity,
            },
          };
        });

        // Decrement stock and recompute each affected item's status.
        for (const { stockItem, line } of saleItems) {
          stockItem.quantity -= line.quantity;
          stockItem.status = computeInventoryStatus(stockItem.quantity, stockItem.reorderLevel);
        }
        await inventory.save({ session });

        const totalAmount = saleItems.reduce((sum, { line }) => sum + line.subtotal, 0);

        let amountPaid: number;
        if (input.paymentStatus === PaymentStatus.PAID) {
          amountPaid = totalAmount;
        } else if (input.paymentStatus === PaymentStatus.UNPAID) {
          amountPaid = 0;
        } else {
          amountPaid = Number(input.amountPaid);
          if (!Number.isFinite(amountPaid) || amountPaid <= 0 || amountPaid >= totalAmount) {
            throw new Error(
              "amountPaid is required for a partial payment and must be between 0 and the total.",
            );
          }
        }

        const [created] = await Sale.create(
          [
            {
              user: userId,
              receiptNumber: generateReceiptNumber(),
              customerName: input.customerName,
              customerPhone: input.customerPhone,
              items: saleItems.map((s) => s.line),
              totalAmount,
              paymentStatus: input.paymentStatus,
              amountPaid,
              balanceDue: totalAmount - amountPaid,
            },
          ],
          { session },
        );

        sale = created as ISaleDoc;
      });

      return sale;
    } finally {
      await session.endSession();
    }
  }

  async getByUserFiltered(
    userId: string | Types.ObjectId,
    options: ListSalesOptions,
  ): Promise<PaginatedSales> {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);

    const match: Record<string, unknown> = { user: userId };
    if (options.paymentStatus) match.paymentStatus = options.paymentStatus;
    if (options.customer) {
      match.customerName = { $regex: escapeRegExp(options.customer), $options: "i" };
    }
    if (options.createdFrom || options.createdTo) {
      match.createdAt = {
        ...(options.createdFrom ? { $gte: options.createdFrom } : {}),
        ...(options.createdTo ? { $lte: options.createdTo } : {}),
      };
    }

    const [items, total] = await Promise.all([
      Sale.find(match)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Sale.countDocuments(match),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 0 };
  }

  async getById(
    userId: string | Types.ObjectId,
    saleId: string | Types.ObjectId,
  ): Promise<ISaleDoc | null> {
    return await Sale.findOne({ _id: saleId, user: userId });
  }

  async updatePayment(
    userId: string | Types.ObjectId,
    saleId: string | Types.ObjectId,
    updates: UpdateSalePaymentInput,
  ): Promise<ISaleDoc | null> {
    const sale = await Sale.findOne({ _id: saleId, user: userId });
    if (!sale) return null;

    const nextStatus = updates.paymentStatus ?? sale.paymentStatus;
    let nextAmountPaid = sale.amountPaid;

    if (nextStatus === PaymentStatus.PAID) {
      nextAmountPaid = sale.totalAmount;
    } else if (nextStatus === PaymentStatus.UNPAID) {
      nextAmountPaid = 0;
    } else if (updates.amountPaid !== undefined) {
      nextAmountPaid = updates.amountPaid;
    }

    if (nextAmountPaid < 0 || nextAmountPaid > sale.totalAmount) {
      throw new Error("amountPaid must be between 0 and the sale's total.");
    }

    sale.paymentStatus = nextStatus;
    sale.amountPaid = nextAmountPaid;
    sale.balanceDue = sale.totalAmount - nextAmountPaid;

    return await sale.save();
  }

  /** Deletes a sale and restores the stock it had taken. */
  async deleteSale(
    userId: string | Types.ObjectId,
    saleId: string | Types.ObjectId,
  ): Promise<ISaleDoc | null> {
    const session = await mongoose.startSession();

    try {
      let deleted: ISaleDoc | null = null;

      await session.withTransaction(async () => {
        const sale = await Sale.findOne({ _id: saleId, user: userId }).session(session);
        if (!sale) return;

        const inventory = await Inventory.findOne({ user: userId }).session(session);
        if (inventory) {
          for (const line of sale.items) {
            const stockItem = inventory.items.id(line.inventoryItem);
            if (stockItem) {
              stockItem.quantity += line.quantity;
              stockItem.status = computeInventoryStatus(stockItem.quantity, stockItem.reorderLevel);
            }
          }
          await inventory.save({ session });
        }

        await sale.deleteOne({ session });
        deleted = sale;
      });

      return deleted;
    } finally {
      await session.endSession();
    }
  }
}

export default new SaleService();
