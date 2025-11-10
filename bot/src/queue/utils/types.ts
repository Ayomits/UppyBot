/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Channel, ConsumeMessage } from "amqplib";

export type Consumer = (msg: ConsumeMessage, ch: Channel) => Promise<any> | any;

export type RegisterConsumers = () => Promise<void>;
