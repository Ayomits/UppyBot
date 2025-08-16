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
    filter: (i, c) =>
      i.message.id === repl.id &&
      (options.filter ? options.filter(i, c) : true),
  });
}
