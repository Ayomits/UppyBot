import type { mongoose } from "@typegoose/typegoose";
import type { AutocompleteInteraction } from "discord.js";
import { DateTime } from "luxon";
import { injectable } from "tsyringe";

import type { BumpGuildCalendarDocument } from "#/db/models/bump-guild-calendar.model.js";
import { BumpGuildCalendarRepository } from "#/db/repositories/bump-guild-calendar.repository.js";

import { endDateValue, startDateValue } from "../stats.const.js";

@injectable()
export class UppyAutocompleteService {
  public static async handleTopAutocomplete(
    interaction: AutocompleteInteraction,
  ) {
    const value = interaction.options.getFocused();
    const { inputDate, startDate, endDate } = this.parseDateString(value);

    const createdAtFilter: mongoose.FilterQuery<BumpGuildCalendarDocument> = {
      guildId: interaction.guildId,
    };

    if (value) {
      if (!inputDate) {
        return interaction.respond([]);
      } else {
        createdAtFilter.timestamp = { $lte: endDate, $gte: startDate };
      }
    }

    const repository = BumpGuildCalendarRepository.create();
    const entries = await repository.findCalendar(
      interaction.guildId!,
      createdAtFilter,
    );

    await interaction.respond(
      entries.map((entry) => ({
        name: entry.formatted,
        value: entry.timestamp.toString(),
      })),
    );
  }

  private static parseDateString(date: string) {
    const formats = ["dd", "dd.MM.yy", "dd.MM"];
    const validFormat = formats
      .map((f) => DateTime.fromFormat(date, f))
      .filter((f) => f.isValid);

    let inputDate: DateTime = DateTime.now().set(startDateValue);

    if (validFormat.length > 0) {
      inputDate = validFormat[0].set(startDateValue);
    }

    const startDate = inputDate.set(startDateValue);
    const endDate = inputDate.set(endDateValue);

    return {
      inputDate: inputDate.isValid ? inputDate : null,
      startDate: inputDate.isValid ? startDate : null,
      endDate: inputDate.isValid ? endDate : null,
    };
  }
}
