import Joi from "joi";
import { InventoryStatus } from "../interface/inventry-interface";

const statusValues = Object.values(InventoryStatus);

const idParam = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export const createInventry = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow("").optional(),
    quantity: Joi.number().integer().min(0).required(),
    price: Joi.number().precision(2).min(0).required(),
    category: Joi.string().required(),
    location: Joi.string().required(),
    supplier: Joi.string().required(),
    reorderLevel: Joi.number().integer().min(0).optional(),
    reorderQuantity: Joi.number().integer().min(0).optional(),
    lastOrderedDate: Joi.date().optional(),
    lastReceivedDate: Joi.date().optional(),
    status: Joi.string()
      .valid(...statusValues)
      .optional(),
  }),
};

export const updateInventry = {
  body: Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().allow("").optional(),
    category: Joi.string().optional(),
    location: Joi.string().optional(),
    supplier: Joi.string().optional(),
    quantity: Joi.number().integer().min(0).optional(),
    price: Joi.number().precision(2).min(0).optional(),
    reorderLevel: Joi.number().integer().min(0).optional(),
    reorderQuantity: Joi.number().integer().min(0).optional(),
    lastOrderedDate: Joi.date().optional(),
    lastReceivedDate: Joi.date().optional(),
    status: Joi.string()
      .valid(...statusValues)
      .optional(),
  }).min(1), // At least one field must be provided
  params: idParam,
};

export const getInventry = {
  params: idParam,
};

export const listInventry = {
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    status: Joi.string()
      .valid(...statusValues)
      .optional(),
    category: Joi.string().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    createdFrom: Joi.date().optional(),
    createdTo: Joi.date().optional(),
  }),
};

export const deleteInventry = {
  params: idParam,
};
