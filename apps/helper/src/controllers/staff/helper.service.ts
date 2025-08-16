/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Interaction,
  type Snowflake,
  type User,
} from "discord.js";
import { injectable } from "tsyringe";

import { type Period } from "./helper.const.js";

@injectable()
export class HelperService {
  constructor() {}

  async handleHelperInfo(
    _user: User,
    _interaction: ChatInputCommandInteraction,
  ) {}

  async handleHelperTop(
    _interaction: ChatInputCommandInteraction,
    _period: Period,
  ) {}

  async handleBumpRemaining(_interaction: ChatInputCommandInteraction) {}

  private async handleBumpBanButton(
    _interaction: ButtonInteraction,
    _userId: Snowflake,
  ) {}

  private async createRemainingMessage(_interaction: Interaction) {}

  private async createHelperInfoMessage(_interaction: Interaction) {}

  private async fetchHelperRoles(_userId: string, _interaction: Interaction) {}
}
