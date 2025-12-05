import { getModelForClass } from "@typegoose/typegoose";
import type {
  AnyParamConstructor,
  IModelOptions,
} from "@typegoose/typegoose/lib/types.js";
import type { Model } from "mongoose";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function createLazyModel<T>(
  getConnection: () => any,
  modelClass: AnyParamConstructor<T>,
  options: IModelOptions,
) {
  let model: any = null;

  return {
    get model(): Model<any> {
      if (!model) {
        const connection = getConnection();
        if (!connection) throw new Error("Connection not available");
        model = getModelForClass(modelClass, {
          ...options,
          existingConnection: connection,
        });
      }
      return model;
    },
  };
}
