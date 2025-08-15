import type { Interaction, InteractionReplyOptions } from "discord.js";

type InteractionErrorMessage = Pick<
  InteractionReplyOptions,
  "ephemeral" | "embeds" | "content"
>;

export class InteractionError {
  private options: Partial<InteractionErrorMessage>;

  constructor(options: Partial<InteractionErrorMessage>) {
    this.options = options;
  }

  async throw(
    interaction: Interaction,
    options: Partial<InteractionErrorMessage> = this.options,
  ) {
    return this.handleResponse(interaction, options);
  }

  private async handleResponse(
    interaction: Interaction,
    options?: Partial<InteractionErrorMessage>,
  ) {
    options =
      typeof options != "undefined"
        ? { ...this.options, ...options }
        : this.options;

    if (interaction.isRepliable()) {
      if (this.options.embeds.length === 0 && !this.options.content) {
        throw new Error("Empty error message");
      }

      const tryEdit = () => {
        try {
          return interaction.editReply(options);
        } catch {
          return interaction.followUp(options);
        }
      };

      if (interaction.deferred || interaction.replied) {
        return tryEdit();
      }
      return interaction.reply(options);
    }
  }
}

export function createError(
  callback: (interaction: Interaction) => Partial<InteractionErrorMessage>,
) {
  const getOptions = (interaction: Interaction) => {
    return callback(interaction);
  };

  return {
    throw: (
      interaction: Interaction,
      modifiedOptions?: Partial<InteractionErrorMessage>,
    ) => {
      const instance = new InteractionError(getOptions(interaction));
      return instance.throw(interaction, modifiedOptions);
    },
    getOptions,
  };
}
