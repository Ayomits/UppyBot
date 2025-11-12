import type { FastifyInstance } from "fastify";

export type Controller = (app: FastifyInstance) => void;
