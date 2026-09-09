import { Document, Types } from "mongoose";

export enum InventoryStatus {
  IN_STOCK = "In Stock",
  LOW_STOCK = "Low Stock",
  OUT_OF_STOCK = "Out of Stock",
}

export interface IInventory {
  user: Types.ObjectId;
  items: IInventoryItem[];
}

export interface IInventoryDoc extends IInventory, Document {}

export interface IInventoryItem {
  name: string;
  description: string;
  quantity: number;
  price: number;
  category: string;
  location: string;
  supplier: string;
  reorderLevel: number;
  reorderQuantity: number;
  lastOrderedDate?: Date;
  lastReceivedDate?: Date;
  status: InventoryStatus;
}

export type InventoryItemInput = Omit<IInventoryItem, "status"> & {
  status?: InventoryStatus;
};

export interface BulkImportRowError {
  row: number;
  message: string;
}

export interface BulkImportResult {
  inventory: IInventoryDoc | null;
  imported: number;
  skipped: number;
  errors: BulkImportRowError[];
}

export interface ListInventoryOptions {
  page?: number;
  limit?: number;
  status?: InventoryStatus;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  createdFrom?: Date;
  createdTo?: Date;
}

export type InventoryItemRecord = IInventoryItem & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export interface PaginatedInventoryItems {
  items: InventoryItemRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}