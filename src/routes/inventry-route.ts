import { Router } from "express";
import { InventoryController } from "../controllers/inventry-controller";
import { requireAuth } from "../midleware/auth-middleware";
import { spreadsheetUpload } from "../config/upload";
import validate from "../midleware/validate.middleware";
import {
  createInventry,
  deleteInventry,
  getInventry,
  listInventry,
  updateInventry,
} from "../validators/inventry-validate";

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Stock items for the authenticated user's business
 */

const router = Router();

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: List the authenticated user's inventory items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [In Stock, Low Stock, Out of Stock] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Case-insensitive exact match
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: createdFrom
 *         schema: { type: string, format: date-time }
 *         description: Filters by each item's own createdAt
 *       - in: query
 *         name: createdTo
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: A page of the user's inventory items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: number, example: 1 }
 *                     limit: { type: number, example: 20 }
 *                     total: { type: number, example: 57 }
 *                     totalPages: { type: number, example: 3 }
 *       400:
 *         description: Invalid query parameter(s)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing, invalid, or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/inventory", requireAuth, validate(listInventry), InventoryController.getInventory);

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Add a single inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, quantity, price, category, location, supplier]
 *             properties:
 *               name: { type: string, example: "Bag of Rice 50kg" }
 *               description: { type: string, example: "Long grain parboiled rice" }
 *               quantity: { type: number, example: 120 }
 *               price: { type: number, example: 45000 }
 *               category: { type: string, example: "Grocery" }
 *               location: { type: string, example: "Main Store" }
 *               supplier: { type: string, example: "Dangote Foods" }
 *               reorderLevel: { type: number, example: 20 }
 *               reorderQuantity: { type: number, example: 50 }
 *               lastOrderedDate: { type: string, format: date-time }
 *               lastReceivedDate: { type: string, format: date-time }
 *               status:
 *                 type: string
 *                 enum: [In Stock, Low Stock, Out of Stock]
 *     responses:
 *       201:
 *         description: The created inventory item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 *       400:
 *         description: Missing required field(s), or quantity/price not numeric
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing, invalid, or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/inventory",
  requireAuth,
  validate(createInventry),
  InventoryController.addSingleItem,
);

/**
 * @swagger
 * /inventory/{id}:
 *   get:
 *     summary: Get a single inventory item by id
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The inventory item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 *       401:
 *         description: Missing, invalid, or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Update one field or more on an inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: At least one field is required.
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               quantity: { type: number }
 *               price: { type: number }
 *               category: { type: string }
 *               location: { type: string }
 *               supplier: { type: string }
 *               reorderLevel: { type: number }
 *               reorderQuantity: { type: number }
 *               lastOrderedDate: { type: string, format: date-time }
 *               lastReceivedDate: { type: string, format: date-time }
 *               status:
 *                 type: string
 *                 enum: [In Stock, Low Stock, Out of Stock]
 *     responses:
 *       200:
 *         description: The updated inventory item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 *       400:
 *         description: No fields provided, or quantity/price/status invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing, invalid, or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete an inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Item deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Item deleted." }
 *       401:
 *         description: Missing, invalid, or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/inventory/:id",
  requireAuth,
  validate(getInventry),
  InventoryController.getSingleItem,
);
router.patch(
  "/inventory/:id",
  requireAuth,
  validate(updateInventry),
  InventoryController.updateItem,
);
router.delete(
  "/inventory/:id",
  requireAuth,
  validate(deleteInventry),
  InventoryController.deleteItem,
);

/**
 * @swagger
 * /inventory/bulk-import:
 *   post:
 *     summary: Bulk import inventory items from a CSV or Excel file
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: A .csv, .xlsx, or .xls file. Expected columns (case/spacing-insensitive)-- name, description, quantity, price, category, location, supplier, reorderLevel, reorderQuantity, lastOrderedDate, lastReceivedDate, status.
 *     responses:
 *       200:
 *         description: Import summary — rows that failed validation are skipped, not fatal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Imported 42 item(s), skipped 2." }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items: { type: object }
 *                     imported: { type: number, example: 42 }
 *                     skipped: { type: number, example: 2 }
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           row: { type: number, example: 5 }
 *                           message: { type: string, example: "Missing required field(s): price." }
 *       400:
 *         description: No file uploaded, or an unsupported/unparseable file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing, invalid, or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/inventory/bulk-import",
  requireAuth,
  spreadsheetUpload.single("file"),
  InventoryController.bulkImport,
);

export default router;
