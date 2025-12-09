import { injectable } from "tsyringe";

import type {
  Promocode,
  PromocodeDocument,
} from "#/shared/db/models/uppy-discord/promocode.model.js";
import { PromocodeModel } from "#/shared/db/models/uppy-discord/promocode.model.js";
import { scheduleManager } from "#/shared/libs/schedule/schedule.manager.js";

@injectable()
export class PromocodeService {
  async handleInit() {
    const promos = await PromocodeModel.model.find({
      expiresAt: { $gt: Date.now() },
    });

    for (const promo of promos) {
      this.pushSchedule(promo._id, promo.expiresAt);
    }

    await PromocodeModel.model.deleteMany({ expiresAt: { $lte: Date.now() } });
  }

  async findExisted(guildId: string, code: string) {
    return (await PromocodeModel.model.findOne({
      guildId,
      code,
    })) as PromocodeDocument | null;
  }

  async createPromocode(dto: Partial<Promocode>) {
    const promo = await PromocodeModel.model.create(dto);
    this.pushSchedule(promo._id, promo.expiresAt);
  }

  async activatePromocode(guildId: string, code: string) {
    return await PromocodeModel.model.updateOne({
      code,
      entries: { $push: guildId },
    });
  }

  async isPromocodeActivated(guildId: string, code: string) {
    return await PromocodeModel.model.exists({ code, entries: guildId });
  }

  async createOrUpdate(dto: Partial<Promocode>) {
    const promo = await PromocodeModel.model.findOneAndUpdate(
      { code: dto.code },
      dto,
      { upsert: true, setDefaultsOnInsert: true, new: true },
    );
    this.pushSchedule(promo._id, promo.expiresAt);
  }

  async removePromocode(code: string) {
    const promo = await PromocodeModel.model.create({ code });
    if (!promo) {
      return;
    }
    this.removeFromSchedule(promo._id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pushSchedule(id: any, expiresAt: Date) {
    scheduleManager.startOnceJob(`promocode-${id}`, expiresAt, async () => {
      await PromocodeModel.model.deleteOne({ _id: id });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private removeFromSchedule(id: any) {
    scheduleManager.stopJob(`promocode-${id}`);
  }
}
