// Column headers are matched loosely (case/space/punctuation-insensitive) so
// real-world spreadsheets ("Item Name", "Reorder Level") map without the

import { BulkImportRowError, InventoryItemInput, InventoryStatus } from "../interface/inventry-interface";
import { parse as parseCsv } from "csv-parse/sync";
import ExcelJS from "exceljs";

// uploader having to match our field names exactly.
export const HEADER_ALIASES: Record<string, keyof InventoryItemInput> = {
  name: "name",
  itemname: "name",
  productname: "name",
  description: "description",
  desc: "description",
  quantity: "quantity",
  qty: "quantity",
  stock: "quantity",
  quantityinstock: "quantity",
  price: "price",
  unitprice: "price",
  cost: "price",
  category: "category",
  type: "category",
  location: "location",
  warehouse: "location",
  store: "location",
  supplier: "supplier",
  vendor: "supplier",
  reorderlevel: "reorderLevel",
  reorderpoint: "reorderLevel",
  minimumstock: "reorderLevel",
  minstock: "reorderLevel",
  reorderquantity: "reorderQuantity",
  reorderqty: "reorderQuantity",
  lastordereddate: "lastOrderedDate",
  lastordered: "lastOrderedDate",
  lastreceiveddate: "lastReceivedDate",
  lastreceived: "lastReceivedDate",
  status: "status",
};

const REQUIRED_FIELDS: (keyof InventoryItemInput)[] = [
  "name",
  "quantity",
  "price",
  "category",
  "location",
  "supplier",
];

export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function normalizeRow(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
	const field = HEADER_ALIASES[normalizeHeader(key)];
	if (field) normalized[field] = value;
  }
  return normalized;
}

export function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;
  const parsed = new Date(String(value));
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

export function mapRowToItem(
  raw: Record<string, unknown>,
  rowNumber: number,
): { item?: InventoryItemInput; error?: BulkImportRowError } {
  const row = normalizeRow(raw);

  const missing = REQUIRED_FIELDS.filter((field) => {
	const value = row[field];
	return value === undefined || value === null || String(value).trim() === "";
  });
  if (missing.length > 0) {
	return {
	  error: { row: rowNumber, message: `Missing required field(s): ${missing.join(", ")}.` },
	};
  }

  const quantity = Number(row.quantity);
  const price = Number(row.price);
  if (Number.isNaN(quantity) || Number.isNaN(price)) {
	return { error: { row: rowNumber, message: "Quantity and price must be numbers." } };
  }

  const reorderLevel = Number(row.reorderLevel);
  const reorderQuantity = Number(row.reorderQuantity);

  const status = Object.values(InventoryStatus).includes(row.status as InventoryStatus)
	? (row.status as InventoryStatus)
	: undefined;

  return {
	item: {
	  name: String(row.name).trim(),
	  description: row.description ? String(row.description).trim() : "",
	  quantity,
	  price,
	  category: String(row.category).trim(),
	  location: String(row.location).trim(),
	  supplier: String(row.supplier).trim(),
	  reorderLevel: Number.isNaN(reorderLevel) ? 0 : reorderLevel,
	  reorderQuantity: Number.isNaN(reorderQuantity) ? 0 : reorderQuantity,
	  lastOrderedDate: parseDate(row.lastOrderedDate),
	  lastReceivedDate: parseDate(row.lastReceivedDate),
	  status,
	},
  };
}

export async function parseCsvBuffer(buffer: Buffer): Promise<Record<string, unknown>[]> {
  return parseCsv(buffer, {
	columns: true,
	skip_empty_lines: true,
	trim: true,
  });
}

export async function parseExcelBuffer(buffer: Buffer): Promise<Record<string, unknown>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
	headers[colNumber] = String(cell.value ?? "").trim();
  });

  const rows: Record<string, unknown>[] = [];
  sheet.eachRow((row, rowNumber) => {
	if (rowNumber === 1) return;
	const record: Record<string, unknown> = {};
	row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
	  const header = headers[colNumber];
	  if (!header) return;
	  const value = cell.value;
	  record[header] =
		value && typeof value === "object" && "text" in (value as any)
		  ? (value as any).text
		  : value;
	});
	if (Object.values(record).some((v) => v !== null && v !== undefined && v !== "")) {
	  rows.push(record);
	}
  });

  return rows;
}
