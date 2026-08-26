import { Types } from "mongoose";
import { IModuleDoc, ModuleKey } from "../interface/module-interface";
import { Module } from "../models/module-model";

class ModuleService {
  async createForUser(
    userId: string | Types.ObjectId,
    modules: ModuleKey[],
  ): Promise<IModuleDoc> {
    const doc = new Module({ user: userId, modules });
    return await doc.save();
  }

  async getByUser(userId: string | Types.ObjectId): Promise<IModuleDoc | null> {
    return await Module.findOne({ user: userId });
  }

  async updateModules(
    userId: string | Types.ObjectId,
    modules: ModuleKey[],
  ): Promise<IModuleDoc | null> {
    return await Module.findOneAndUpdate(
      { user: userId },
      { modules },
      { new: true, upsert: true },
    );
  }
}

export default new ModuleService();
