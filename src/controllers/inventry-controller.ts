import { Request, Response } from "express";
import inventoryService from "../services/inventry-service";
import { InventoryItemInput, InventoryStatus } from "../interface/inventry-interface";

export const InventoryController = {
  getInventory: async (req: Request, res: Response) => {
    try {
      const { page, limit, status, category, minPrice, maxPrice, createdFrom, createdTo } =
        req.query;

      const result = await inventoryService.getByUserFiltered(req.user!.id, {
        page: page !== undefined ? Number(page) : undefined,
        limit: limit !== undefined ? Number(limit) : undefined,
        status: status as InventoryStatus | undefined,
        category: category as string | undefined,
        minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
        createdFrom: createdFrom ? new Date(createdFrom as string) : undefined,
        createdTo: createdTo ? new Date(createdTo as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getSingleItem: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const inventory = await inventoryService.getByUser(req.user!.id);
      const item = inventory?.items.find((i: any) => i._id.toString() === id);

      if (!item) {
        return res.status(404).json({ success: false, message: "Item not found." });
      }

      res.status(200).json({ success: true, data: item });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  addSingleItem: async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        quantity,
        price,
        category,
        location,
        supplier,
        reorderLevel,
        reorderQuantity,
        lastOrderedDate,
        lastReceivedDate,
        status,
      } = req.body;

      const requiredFields = ["name", "quantity", "price", "category", "location", "supplier"];
      const missing = requiredFields.filter(
        (field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === "",
      );
      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required field(s): ${missing.join(", ")}.`,
        });
      }

      const parsedQuantity = Number(quantity);
      const parsedPrice = Number(price);
      if (Number.isNaN(parsedQuantity) || Number.isNaN(parsedPrice)) {
        return res
          .status(400)
          .json({ success: false, message: "Quantity and price must be numbers." });
      }

      const inventory = await inventoryService.addItem(req.user!.id, {
        name,
        description: description ?? "",
        quantity: parsedQuantity,
        price: parsedPrice,
        category,
        location,
        supplier,
        reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : 0,
        reorderQuantity: reorderQuantity !== undefined ? Number(reorderQuantity) : 0,
        lastOrderedDate: lastOrderedDate ? new Date(lastOrderedDate) : undefined,
        lastReceivedDate: lastReceivedDate ? new Date(lastReceivedDate) : undefined,
        status,
      });

      const items = inventory?.items ?? [];
      const created = items[items.length - 1];

      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateItem: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        quantity,
        price,
        category,
        location,
        supplier,
        reorderLevel,
        reorderQuantity,
        lastOrderedDate,
        lastReceivedDate,
        status,
      } = req.body;

      if (quantity !== undefined && Number.isNaN(Number(quantity))) {
        return res.status(400).json({ success: false, message: "Quantity must be a number." });
      }
      if (price !== undefined && Number.isNaN(Number(price))) {
        return res.status(400).json({ success: false, message: "Price must be a number." });
      }
      if (status !== undefined && !Object.values(InventoryStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${Object.values(InventoryStatus).join(", ")}.`,
        });
      }

      const updates: Partial<InventoryItemInput> = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (quantity !== undefined) updates.quantity = Number(quantity);
      if (price !== undefined) updates.price = Number(price);
      if (category !== undefined) updates.category = category;
      if (location !== undefined) updates.location = location;
      if (supplier !== undefined) updates.supplier = supplier;
      if (reorderLevel !== undefined) updates.reorderLevel = Number(reorderLevel);
      if (reorderQuantity !== undefined) updates.reorderQuantity = Number(reorderQuantity);
      if (lastOrderedDate !== undefined) updates.lastOrderedDate = new Date(lastOrderedDate);
      if (lastReceivedDate !== undefined) updates.lastReceivedDate = new Date(lastReceivedDate);
      if (status !== undefined) updates.status = status;

      if (Object.keys(updates).length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "At least one field is required." });
      }

      const inventory = await inventoryService.updateItem(req.user!.id, id as string, updates);
      if (!inventory) {
        return res.status(404).json({ success: false, message: "Item not found." });
      }

      const updated = inventory.items.find((item: any) => item._id.toString() === id);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteItem: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const inventory = await inventoryService.getByUser(req.user!.id);
      const exists = inventory?.items.some((item: any) => item._id.toString() === id);
      if (!exists) {
        return res.status(404).json({ success: false, message: "Item not found." });
      }

      await inventoryService.removeItem(req.user!.id, id as string);

      res.status(200).json({ success: true, message: "Item deleted." });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  bulkImport: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file was uploaded." });
      }

      const result = await inventoryService.bulkImportFromFile(
        req.user!.id,
        req.file.buffer,
        req.file.originalname,
      );

      res.status(200).json({
        success: true,
        message: `Imported ${result.imported} item(s), skipped ${result.skipped}.`,
        data: {
          items: result.inventory?.items ?? [],
          imported: result.imported,
          skipped: result.skipped,
          errors: result.errors,
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
