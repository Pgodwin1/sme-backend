import Joi from "joi";
import { PaymentStatus } from "../interface/sale-interface";

const statusValues = Object.values(PaymentStatus);

const idParam = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const saleItem = Joi.object({
  inventoryItem: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).required(),
});

export const createSale = {
  body: Joi.object({
    customerName: Joi.string().allow("").optional(),
    customerPhone: Joi.string().allow("").optional(),
    items: Joi.array().items(saleItem).min(1).required(),
    paymentStatus: Joi.string()
      .valid(...statusValues)
      .required(),
    amountPaid: Joi.number().min(0).when("paymentStatus", {
      is: PaymentStatus.PARTIAL,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),
};

export const updateSalePayment = {
  body: Joi.object({
    paymentStatus: Joi.string()
      .valid(...statusValues)
      .optional(),
    amountPaid: Joi.number().min(0).optional(),
  }).min(1),
  params: idParam,
};

export const getSale = {
  params: idParam,
};

export const listSales = {
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    paymentStatus: Joi.string()
      .valid(...statusValues)
      .optional(),
    customer: Joi.string().optional(),
    createdFrom: Joi.date().optional(),
    createdTo: Joi.date().optional(),
  }),
};

export const deleteSale = {
  params: idParam,
};
