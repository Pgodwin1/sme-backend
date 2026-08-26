import { Request, Response } from "express";
import { moduleCatalog } from "../data/modules";
import { ModuleKey } from "../interface/module-interface";

export const ModuleController = {
  list: async (_req: Request, res: Response) => {
    res.status(200).json({ success: true, data: moduleCatalog });
  },

  getByKey: async (req: Request, res: Response) => {
    const { key } = req.params;

    if (!Object.values(ModuleKey).includes(key as ModuleKey)) {
      return res
        .status(404)
        .json({ success: false, message: "Module not found." });
    }

    const module = moduleCatalog.find((m) => m.key === key);
    if (!module) {
      return res
        .status(404)
        .json({ success: false, message: "Module not found." });
    }

    res.status(200).json({ success: true, data: module });
  },
};
