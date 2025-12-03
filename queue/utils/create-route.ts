import type { Message } from "amqplib";

import { rabbitMq } from "#/shared/db/rabbitmq.js";
import { logger } from "#/shared/libs/logger/index.js";

import { publishMessage } from "./publish-message.js";

type CreateRouteOptions<T> = {
  queue: string;
  produceCallback?: (payload: T) => void | Promise<void>;
  consumeCallback?: (msg: Message) => void | Promise<void>;
};

export function createRoute<T = object>(opts: CreateRouteOptions<T>) {
  return {
    async register() {
      const channel = await rabbitMq.createChannel();

      const queue = opts.queue;

      await channel.assertQueue(queue, {
        durable: true,
        autoDelete: false,
      });

      await channel.consume(queue, async (msg) => {
        try {
          await opts?.consumeCallback?.(msg!);
          channel.ack(msg!);
        } catch (err) {
          logger.error(err);
          channel.nack(msg!, false, false);
        }
      });

      logger.log(`${queue} consumer successfully connected`);
    },
    async produce(payload: T) {
      if (opts.produceCallback) {
        return opts.produceCallback(payload);
      }
      return publishMessage(opts.queue, payload as object);
    },
  };
}
