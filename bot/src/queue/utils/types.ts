/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ConsumeMessage } from "amqplib";

export type Consumer = (msg: ConsumeMessage) => Promise<any> | any;

export type RegisterConsumers = () => Promise<void>;
