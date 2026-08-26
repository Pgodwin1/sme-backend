import { Document, Types } from "mongoose";

export enum ModuleKey {
  HR = "hr",
  Payroll = "payroll",
  CRM = "crm",
  Sales = "sales",
  Inventory = "inventory",
  Accounting = "accounting",
  Procurement = "procurement",
  Approvals = "approvals",
  Reports = "reports",
}

export interface IModule {
  user: Types.ObjectId;
  modules: ModuleKey[];
}

export interface IModuleDoc extends IModule, Document {}

export interface IModuleDefinition {
  key: ModuleKey;
  code: string;
  name: string;
  description: string;
  features: string[];
  /** Whether this module is switched on by default in onboarding UIs */
  defaultOn: boolean;
  /** Included in the MVP launch scope */
  inMvp: boolean;
}
