/* eslint-disable @typescript-eslint/no-explicit-any */
import EventEmitter from "events";

import type { AppEvents } from "./index.js";

export class AppEventEmitter<T extends Record<string, any>> {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
  }

  static create() {
    return new AppEventEmitter();
  }

  emit<K extends keyof T & string>(
    eventName: K,
    ...args: Parameters<T[K]>
  ): boolean {
    return this.emitter.emit(eventName, ...args);
  }

  on<K extends keyof T & string>(eventName: K, handler: T[K]): this {
    console.log(eventName);
    this.emitter.on(eventName, handler as any);
    return this;
  }

  once<K extends keyof T & string>(eventName: K, handler: T[K]): this {
    this.emitter.once(eventName, handler as any);
    return this;
  }

  off<K extends keyof T & string>(eventName: K, handler: T[K]): this {
    this.emitter.off(eventName, handler as any);
    return this;
  }
}

export const appEventEmitter = new AppEventEmitter<AppEvents>();
