import type { Message } from "amqplib";

export function parseConsumerData<T>(msg: Message) {
  return JSON.parse(msg.content.toString()) as T;
}
