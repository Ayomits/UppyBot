import { Events } from "discord.js";
import { Discord, On } from "discordx";
import { inject, singleton } from "tsyringe";

import { PromocodeService } from "./promocode.service.js";

@Discord()
@singleton()
export class PromocodeController {
  constructor(
    @inject(PromocodeService) private promocodeService: PromocodeService
  ) {}

  @On({ event: Events.ClientReady })
  handleReady() {
    return this.promocodeService.handleInit();
  }
}
