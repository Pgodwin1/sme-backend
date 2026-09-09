import { Types } from "mongoose";
import {
  BulkImportResult,
  BulkImportRowError,
  IInventoryDoc,
  InventoryItemInput,
  InventoryStatus,
  ListInventoryOptions,
  PaginatedInventoryItems,
} from "../interface/inventry-interface";
import { Inventory } from "../models/inventry-model";
import { mapRowToItem, parseCsvBuffer, parseExcelBuffer } from "../utils/inventryUtils";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


class InventoryService {
  async createForUser(
    userId: string | Types.ObjectId,
    items: InventoryItemInput[] = [],
  ): Promise<IInventoryDoc> {
    const doc = new Inventory({ user: userId, items });
    return await doc.save();
  }

  async getByUser(userId: string | Types.ObjectId): Promise<IInventoryDoc | null> {
    return await Inventory.findOne({ user: userId });
  }

  async getByUserFiltered(
    userId: string | Types.ObjectId,
    options: ListInventoryOptions,
  ): Promise<PaginatedInventoryItems> {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);

    const itemMatch: Record<string, unknown> = {};
    if (options.status) itemMatch["items.status"] = options.status;
    if (options.category) {
      itemMatch["items.category"] = { $regex: `^${escapeRegExp(options.category)}$`, $options: "i" };
    }
    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      itemMatch["items.price"] = {
        ...(options.minPrice !== undefined ? { $gte: options.minPrice } : {}),
        ...(options.maxPrice !== undefined ? { $lte: options.maxPrice } : {}),
      };
    }
    if (options.createdFrom || options.createdTo) {
      itemMatch["items.createdAt"] = {
        ...(options.createdFrom ? { $gte: options.createdFrom } : {}),
        ...(options.createdTo ? { $lte: options.createdTo } : {}),
      };
    }

    const userObjectId =
      typeof userId === "string" ? new Types.ObjectId(userId) : userId;

    const [result] = await Inventory.aggregate([
      { $match: { user: userObjectId } },
      { $unwind: "$items" },
      ...(Object.keys(itemMatch).length > 0 ? [{ $match: itemMatch }] : []),
      { $sort: { "items.createdAt": -1 } },
      {
        $facet: {
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            { $replaceRoot: { newRoot: "$items" } },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const total = result?.totalCount?.[0]?.count ?? 0;

    return {
      items: result?.data ?? [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async addItem(
    userId: string | Types.ObjectId,
    item: InventoryItemInput,
  ): Promise<IInventoryDoc | null> {
    return await Inventory.findOneAndUpdate(
      { user: userId },
      { $push: { items: item } },
      { new: true, upsert: true },
    );
  }

  async updateItem(
    userId: string | Types.ObjectId,
    itemId: string | Types.ObjectId,
    updates: Partial<InventoryItemInput>,
  ): Promise<IInventoryDoc | null> {
    const setFields = Object.fromEntries(
      Object.entries(updates).map(([key, value]) => [`items.$.${key}`, value]),
    );

    return await Inventory.findOneAndUpdate(
      { user: userId, "items._id": itemId },
      { $set: setFields },
      { new: true },
    );
  }

  async removeItem(
    userId: string | Types.ObjectId,
    itemId: string | Types.ObjectId,
  ): Promise<IInventoryDoc | null> {
    return await Inventory.findOneAndUpdate(
      { user: userId },
      { $pull: { items: { _id: itemId } } },
      { new: true },
    );
  }

  /**
   * Parses a CSV or Excel (.xlsx/.xls) buffer and pushes every valid row
   * into the user's inventory in a single update. Invalid rows are skipped
   * and reported back rather than failing the whole import.
   */
  async bulkImportFromFile(
    userId: string | Types.ObjectId,
    buffer: Buffer,
    originalFilename: string,
  ): Promise<BulkImportResult> {
    const extension = originalFilename.split(".").pop()?.toLowerCase();

    let rawRows: Record<string, unknown>[];
    if (extension === "csv") {
      rawRows = await parseCsvBuffer(buffer);
    } else if (extension === "xlsx" || extension === "xls") {
      rawRows = await parseExcelBuffer(buffer);
    } else {
      throw new Error("Unsupported file type. Upload a .csv, .xlsx, or .xls file.");
    }

    const items: InventoryItemInput[] = [];
    const errors: BulkImportRowError[] = [];

    rawRows.forEach((raw, index) => {
      const { item, error } = mapRowToItem(raw, index + 2); // +2: header row + 1-index
      if (item) items.push(item);
      if (error) errors.push(error);
    });

    const inventory =
      items.length > 0
        ? await Inventory.findOneAndUpdate(
            { user: userId },
            { $push: { items: { $each: items } } },
            { new: true, upsert: true },
          )
        : await this.getByUser(userId);

    return { inventory, imported: items.length, skipped: errors.length, errors };
  }
}

export default new InventoryService();
