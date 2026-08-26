import { Schema, model } from "mongoose";
import { IModuleDoc, ModuleKey } from "../interface/module-interface";

const moduleSchema = new Schema<IModuleDoc>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    modules: {
      type: [String],
      enum: Object.values(ModuleKey),
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export const Module = model("Module", moduleSchema);
