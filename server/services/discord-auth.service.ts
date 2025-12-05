import type { FastifyReply, FastifyRequest } from "fastify";
import { DateTime } from "luxon";

import { telegramNotificationRoute } from "#/queue/routes/telegram-notification/index.js";
import {
  fetchDiscordOauth2Tokens,
  fetchDiscordOauth2User,
} from "#/shared/api/discord/index.js";
import type { NotificationUser } from "#/shared/db/models/uppy-telegram/user.model.js";
import { NotificationUserTokenRepository } from "#/shared/db/repositories/uppy-telegram/token.repository.js";
import { NotificationUserRepository } from "#/shared/db/repositories/uppy-telegram/user.repository.js";
import { configService } from "#/shared/libs/config/index.js";
import { CryptographyService } from "#/shared/libs/crypto/index.js";

import { DISCORD_URL } from "../const/index.js";
import { HTTPStatus } from "../const/status.js";

const clientId = configService.getOrThrow("DISCORD_CLIENT_ID");
const clientSecret = configService.getOrThrow("DISCORD_CLIENT_SECRET");
const redirectUri = configService.getOrThrow("DISCORD_REDIRECT_URI");

type Payload = {
  chatId: number;
  token: string;
};

export class DiscordAuthService {
  static create() {
    return new DiscordAuthService();
  }

  async handleDiscordLogin(req: FastifyRequest, reply: FastifyReply) {
    const chatId = req.query?.["chat_id"];
    const token = req.query?.["token"];

    if (!chatId) {
      return reply.code(HTTPStatus.UnprocessableEntity).send({
        message: "chat_id must be provided inside of query",
      });
    }

    if (!token) {
      return reply.code(HTTPStatus.UnprocessableEntity).send({
        message: "token must be provided inside of query",
      });
    }

    const tokenRepository = NotificationUserTokenRepository.create();

    const isValid = await tokenRepository.validate(token);

    if (!isValid) {
      return reply.code(HTTPStatus.Unauthorized).send({
        message: `Token invalid`,
      });
    }

    const numTgId = Number(chatId);

    if (Number.isNaN(numTgId)) {
      return reply.code(HTTPStatus.UnprocessableEntity).send({
        message: "tg_id must be number value",
      });
    }

    const cryptography = CryptographyService.create();

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      scope: "guilds identify",
      redirect_uri: redirectUri,
      state: cryptography.encodeBase64(
        JSON.stringify(this.createPayload(chatId, token)),
      ),
    });

    return reply.code(HTTPStatus.Ok).send({
      url: `${DISCORD_URL}/oauth2/authorize?${params.toString()}`,
    });
  }

  async handleDiscordCallback(req: FastifyRequest, reply: FastifyReply) {
    const [code, state] = [req.query?.["code"], req.query?.["state"]];

    reply.type("html");

    const cryptography = CryptographyService.create();

    const templatePath = "auth/login";

    if (!code) {
      return reply.view(templatePath, {
        isSuccess: false,
      });
    }

    if (!state) {
      return reply.view(templatePath, {
        isSuccess: false,
      });
    }

    const stateJson = JSON.parse(cryptography.decodeBase64(state)) as Payload;

    if (!stateJson.token) {
      return reply.view(templatePath, {
        isSuccess: false,
      });
    }

    const tokenRepository = NotificationUserTokenRepository.create();

    const isValid = await tokenRepository.validate(stateJson.token);

    if (!isValid) {
      return reply.view(templatePath, {
        isSuccess: false,
      });
    }

    if (!stateJson.chatId) {
      return reply.view(templatePath, {
        isSuccess: false,
      });
    }

    if (Number.isNaN(stateJson.chatId)) {
      return reply.view(templatePath, {
        isSuccess: false,
      });
    }

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      scope: "guilds identity",
    });

    const tokenQuery = await fetchDiscordOauth2Tokens(params);

    const accessToken = tokenQuery.data.access_token;
    const refreshToken = tokenQuery.data.refresh_token;

    const tokens: NotificationUser["tokens"] = {
      access_token: cryptography.encrypt(accessToken),
      refresh_token: cryptography.encrypt(refreshToken),
      expires_at: DateTime.now()
        .plus({ seconds: tokenQuery.data.expires_in })
        .toJSDate(),
    };

    const userRepository = NotificationUserRepository.create();

    const discordUser = await fetchDiscordOauth2User(accessToken, refreshToken);

    await userRepository.createUser({
      discord_user_id: discordUser!.data.id,
      telegram_user_id: stateJson.chatId,
      tokens,
    });

    telegramNotificationRoute.produce({
      content: `Вы успешно авторизировались как <strong>${discordUser?.data.global_name ?? discordUser?.data.username}</strong>`,
      telegram_id: stateJson.chatId,
      parse_mode: "HTML",
    });

    await tokenRepository.invalidate(stateJson.token);

    return reply.view(templatePath, {
      isSuccess: true,
      username: discordUser?.data.global_name ?? discordUser?.data.username,
    });
  }

  private createPayload(chatId: number, token: string): Payload {
    return {
      chatId,
      token,
    };
  }
}
