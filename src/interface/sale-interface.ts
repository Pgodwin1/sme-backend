import { Document, Types } from "mongoose";

export enum PaymentStatus {
  PAID = "Paid",
  PARTIAL = "Partial",
  UNPAID = "Unpaid",
}

export interface ISaleItem {
  inventoryItem: Types.ObjectId;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface ISale {
  user: Types.ObjectId;
  receiptNumber: string;
  customerName?: string;
  customerPhone?: string;
  items: ISaleItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  balanceDue: number;
}

export interface ISaleDoc extends ISale, Document {}

export interface SaleItemInput {
  inventoryItem: string;
  quantity: number;
}

export interface CreateSaleInput {
  customerName?: string;
  customerPhone?: string;
  items: SaleItemInput[];
  paymentStatus: PaymentStatus;
  /** Required when paymentStatus is PARTIAL; ignored (derived) for PAID/UNPAID. */
  amountPaid?: number;
}

export interface UpdateSalePaymentInput {
  paymentStatus?: PaymentStatus;
  amountPaid?: number;
}

export interface ListSalesOptions {
  page?: number;
  limit?: number;
  paymentStatus?: PaymentStatus;
  customer?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface PaginatedSales {
  items: ISaleDoc[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
