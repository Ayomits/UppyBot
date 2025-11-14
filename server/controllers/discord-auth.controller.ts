import { DiscordAuthService } from "../services/discord-auth.service.js";
import type { Controller } from "../types/controller.js";

export const registerDiscordAuthController: Controller = (app) => {
  const service = DiscordAuthService.create();

  app.get("/discord/login", service.handleDiscordLogin.bind(service));
  app.get("/discord/callback", service.handleDiscordCallback.bind(service));
};