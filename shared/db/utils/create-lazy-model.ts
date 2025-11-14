import { getModelForClass } from "@typegoose/typegoose";
import type { IModelOptions } from "@typegoose/typegoose/lib/types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function createLazyModel(
  getConnection: () => any,
  modelClass: any,
  options: IModelOptions,
) {
  let model: any = null;

  return {
    get model() {
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
