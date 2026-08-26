import { Router } from "express";
import { ModuleController } from "../controllers/module-controller";

/**
 * @swagger
 * tags:
 *   name: Modules
 *   description: The catalog of business modules available on the platform
 */

const router = Router();

/**
 * @swagger
 * /modules:
 *   get:
 *     summary: List the full module catalog
 *     tags: [Modules]
 *     responses:
 *       200:
 *         description: All available modules
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Module' }
 */
router.get("/modules", ModuleController.list);

/**
 * @swagger
 * /modules/{key}:
 *   get:
 *     summary: Get a single module by its key
 *     tags: [Modules]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           enum: [hr, payroll, crm, sales, inventory, accounting, procurement, approvals, reports]
 *     responses:
 *       200:
 *         description: The requested module
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Module' }
 *       404:
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/modules/:key", ModuleController.getByKey);

export default router;
