import { Request, Response } from "express";
import saleService from "../services/sale-service";
import { PaymentStatus } from "../interface/sale-interface";

export const SaleController = {
  createSale: async (req: Request, res: Response) => {
    try {
      const { customerName, customerPhone, items, paymentStatus, amountPaid } = req.body;

      const sale = await saleService.createSale(req.user!.id, {
        customerName,
        customerPhone,
        items,
        paymentStatus,
        amountPaid: amountPaid !== undefined ? Number(amountPaid) : undefined,
      });

      res.status(201).json({ success: true, data: sale });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getSales: async (req: Request, res: Response) => {
    try {
      const { page, limit, paymentStatus, customer, createdFrom, createdTo } = req.query;

      const result = await saleService.getByUserFiltered(req.user!.id, {
        page: page !== undefined ? Number(page) : undefined,
        limit: limit !== undefined ? Number(limit) : undefined,
        paymentStatus: paymentStatus as PaymentStatus | undefined,
        customer: customer as string | undefined,
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

  getSingleSale: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const sale = await saleService.getById(req.user!.id, id as string);

      if (!sale) {
        return res.status(404).json({ success: false, message: "Sale not found." });
      }

      res.status(200).json({ success: true, data: sale });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updatePayment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { paymentStatus, amountPaid } = req.body;

      const sale = await saleService.updatePayment(req.user!.id, id as string, {
        paymentStatus,
        amountPaid: amountPaid !== undefined ? Number(amountPaid) : undefined,
      });

      if (!sale) {
        return res.status(404).json({ success: false, message: "Sale not found." });
      }

      res.status(200).json({ success: true, data: sale });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  deleteSale: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const sale = await saleService.deleteSale(req.user!.id, id as string);

      if (!sale) {
        return res.status(404).json({ success: false, message: "Sale not found." });
      }

      res.status(200).json({
        success: true,
        message: "Sale deleted and the stock it used has been restored.",
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
