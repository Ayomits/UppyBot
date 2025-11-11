import type {
  Message,
  MessageCollectorOptionsParams,
  MessageComponentType,
} from "discord.js";

export function createSafeCollector<
  C extends MessageComponentType = MessageComponentType,
>(repl: Message, options?: MessageCollectorOptionsParams<C, boolean>) {
  return repl.createMessageComponentCollector({
    ...options,
    time: options?.time ?? 600_000,
    filter: (interaction, collector) => {
      const isSameMessage = interaction.message.id === repl.id;
      if (!isSameMessage) return false;

      if (options?.filter) {
        return options.filter(interaction, collector);
      }

      return true;
    },
  });
}
