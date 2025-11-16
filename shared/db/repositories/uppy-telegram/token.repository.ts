import { DateTime } from "luxon";

import { CryptographyService } from "#/shared/libs/crypto/index.js";

import { NotificationUserTokenModel } from "../../models/uppy-telegram/tokens.model.js";

export class NotificationUserTokenRepository {
  constructor(private cryptography: CryptographyService) {}

  static create() {
    return new NotificationUserTokenRepository(CryptographyService.create());
  }

  async validate(token: string) {
    const decrypted = JSON.parse(this.cryptography.decrypt(token)) as Partial<{
      expired_at: Date;
      telegram_user_id: number;
      _id: string;
      __v: number;
    }>;

    if (!decrypted._id) {
      return false;
    }

    const entry = await NotificationUserTokenModel.model.findOne({
      _id: decrypted._id,
    });

    if (
      !entry ||
      Date.now() > DateTime.fromJSDate(new Date(entry.expired_at)).toMillis()
    ) {
      return false;
    }

    return true;
  }

  async invalidate(token: string) {
    const decrypted = JSON.parse(this.cryptography.decrypt(token)) as Partial<{
      expired_at: Date;
      telegram_user_id: number;
      _id: string;
      __v: number;
    }>;

    if (!decrypted._id) {
      return false;
    }

    await NotificationUserTokenModel.model.deleteOne({ _id: decrypted._id });

    return true;
  }

  async sign(tgId: number) {
    const token = await NotificationUserTokenModel.model.create({
      telegram_user_id: tgId,
      expired_at: DateTime.now().plus({ minutes: 10 }).toJSDate(),
    });

    return this.cryptography.encrypt(JSON.stringify(token));
  }
}
