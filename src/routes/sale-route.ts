import { Router } from "express";
import { SaleController } from "../controllers/sale-controller";
import { requireAuth } from "../midleware/auth-middleware";
import validate from "../midleware/validate.middleware";
import {
  createSale,
  deleteSale,
  getSale,
  listSales,
  updateSalePayment,
} from "../validators/sale-validate";

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Point-of-sale transactions for the authenticated user's business
 */

const router = Router();

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: List the authenticated user's sales
 *     tags: [Sales]
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
 *         name: paymentStatus
 *         schema: { type: string, enum: [Paid, Partial, Unpaid] }
 *       - in: query
 *         name: customer
 *         schema: { type: string }
 *         description: Case-insensitive partial match on customerName
 *       - in: query
 *         name: createdFrom
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: createdTo
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: A page of the user's sales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Sale' }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: number, example: 1 }
 *                     limit: { type: number, example: 20 }
 *                     total: { type: number, example: 57 }
 *                     totalPages: { type: number, example: 3 }
 *       401:
 *         description: Missing, invalid, or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/sales", requireAuth, validate(listSales), SaleController.getSales);

/**
 * @swagger
 * /sales:
 *   post:
 *     summary: Record a new sale
 *     description: >
 *       Looks up each item's current price/stock from the business's inventory,
 *       decrements stock accordingly, and computes totals server-side — the
 *       client only sends the inventory item id and quantity, not the price.
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, paymentStatus]
 *             properties:
 *               customerName: { type: string, example: "Danladi Pharmacy" }
 *               customerPhone: { type: string, example: "+2348012345678" }
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [inventoryItem, quantity]
 *                   properties:
 *                     inventoryItem: { type: string, example: "670f1c2e5b3c2a0012a4e5f1" }
 *                     quantity: { type: number, example: 2 }
 *               paymentStatus:
 *                 type: string
 *                 enum: [Paid, Partial, Unpaid]
 *               amountPaid:
 *                 type: number
 *                 description: Required when paymentStatus is "Partial".
 *                 example: 5000
 *     responses:
 *       201:
 *         description: The created sale
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Sale' }
 *       400:
 *         description: Invalid item(s), insufficient stock, or invalid amountPaid
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
router.post("/sales", requireAuth, validate(createSale), SaleController.createSale);

/**
 * @swagger
 * /sales/{id}:
 *   get:
 *     summary: Get a single sale by id
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The sale
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Sale' }
 *       401:
 *         description: Missing, invalid, or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sale not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete a sale and restore the stock it used
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Sale deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Sale deleted and the stock it used has been restored." }
 *       401:
 *         description: Missing, invalid, or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sale not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/sales/:id", requireAuth, validate(getSale), SaleController.getSingleSale);
router.delete("/sales/:id", requireAuth, validate(deleteSale), SaleController.deleteSale);

/**
 * @swagger
 * /sales/{id}/payment:
 *   patch:
 *     summary: Update a sale's payment status (e.g. settle a credit sale)
 *     tags: [Sales]
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
 *               paymentStatus:
 *                 type: string
 *                 enum: [Paid, Partial, Unpaid]
 *               amountPaid:
 *                 type: number
 *                 description: Only meaningful when paymentStatus is (or stays) "Partial".
 *     responses:
 *       200:
 *         description: The updated sale
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Sale' }
 *       400:
 *         description: No fields provided, or amountPaid out of range
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
 *         description: Sale not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/sales/:id/payment",
  requireAuth,
  validate(updateSalePayment),
  SaleController.updatePayment,
);

export default router;
