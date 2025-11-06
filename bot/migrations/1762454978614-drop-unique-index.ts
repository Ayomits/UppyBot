// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck no check means no fucking check!
import mongoose from "mongoose";

import {
  BumpLogCollectionName,
  BumpLogSourceType,
} from "#/db/models/bump-log.model";
import { Env } from "#/libs/config/index";

export async function up(): Promise<void> {
  await mongoose.connect(Env.MongoUrl);

  // Выполняем update отдельно
  await mongoose.connection
    .collection(BumpLogCollectionName)
    .updateMany(
      { source: { $ne: BumpLogSourceType.Web } },
      { $set: { source: BumpLogSourceType.Discord } }
    );

  // Удаляем индекс отдельно
  try {
    await mongoose.connection
      .collection(BumpLogCollectionName)
      .dropIndex("messageId_1");
    console.log("Index messageId_1 dropped successfully");
  } catch (error) {
    // Если индекс уже не существует, игнорируем ошибку
    if (error.code !== 27) { // 27 - индекс не найден
      throw error;
    }
    console.log("Index messageId_1 already removed");
  }

  await mongoose.connection.close();
}

export async function down(): Promise<void> {
  await mongoose.connect(Env.MongoUrl);

  try {
    // Создаем sparse индекс вместо обычного
    await mongoose.connection
      .collection(BumpLogCollectionName)
      .createIndex({ messageId: 1 }, { 
        unique: true, 
        sparse: true,
        name: "messageId_1" 
      });
    console.log("Sparse index messageId_1 created successfully");
  } catch (error) {
    console.log("Index creation failed:", error.message);
  }

  await mongoose.connection.close();
}