import { DiscordAuthService } from "../services/discord-auth.service.js";
import type { Controller } from "../types/controller.js";

export const registerDiscordAuthController: Controller = (app) => {
  const service = DiscordAuthService.create();

  app.get("/api/discord/login", service.handleDiscordLogin.bind(service));
  app.get("/api/discord/callback", service.handleDiscordCallback.bind(service));
};
