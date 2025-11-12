import type { FastifyReply, FastifyRequest } from "fastify";
import { DateTime } from "luxon";

import {
  fetchDiscordOauth2Tokens,
  fetchDiscordOauth2User,
} from "#/shared/api/discord/index.js";
import type { NotificationUser } from "#/shared/db/models/uppy-telegram/user.model.js";
import { NotificationUserRepository } from "#/shared/db/repositories/uppy-telegram/user.repository.js";
import { configService } from "#/shared/libs/config/index.js";

import { DISCORD_URL } from "../const/index.js";
import { HTTPStatus } from "../const/status.js";

const clientId = configService.getOrThrow("DISCORD_CLIENT_ID");
const clientSecret = configService.getOrThrow("DISCORD_CLIENT_SECRET");
const redirectUri = configService.getOrThrow("DISCORD_REDIRECT_URI");

export class DiscordAuthService {
  static create() {
    return new DiscordAuthService();
  }

  handleDiscordLogin(req: FastifyRequest, reply: FastifyReply) {
    const tgId = req.query?.["tg_id"];

    if (!tgId) {
      return reply.code(HTTPStatus.UnprocessableEntity).send({
        message: "tg_id should be provided inside of query",
      });
    }

    const numTgId = Number(tgId);

    if (Number.isNaN(numTgId)) {
      return reply.code(HTTPStatus.UnprocessableEntity).send({
        message: "tg_id must be number value",
      });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      scope: "guilds identify",
      redirect_uri: redirectUri,
      state: btoa(JSON.stringify({ tgId: numTgId })),
    });

    return reply.code(HTTPStatus.Ok).send({
      url: `${DISCORD_URL}/oauth2/authorize?${params.toString()}`,
    });
  }

  async handleDiscordCallback(req: FastifyRequest, reply: FastifyReply) {
    const [code, state] = [req.query?.["code"], req.query?.["state"]];

    if (!code) {
      return reply.code(HTTPStatus.UnprocessableEntity).send({
        message: "code must be provided in query",
      });
    }

    if (!state) {
      return reply.code(HTTPStatus.UnprocessableEntity).send({
        message: "state must be provided in query",
      });
    }

    const stateJson = JSON.parse(atob(state)) as { tgId: number };

    if (!stateJson.tgId) {
      return reply.code(HTTPStatus.UnprocessableEntity).send({
        message: "property tgId must be in state",
      });
    }

    if (Number.isNaN(stateJson.tgId)) {
      return reply.code(HTTPStatus.UnprocessableEntity).send({
        message: "tgId must be a valid number",
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

    const tokens: NotificationUser["tokens"] = {
      access_token: tokenQuery.data.access_token,
      refresh_token: tokenQuery.data.refresh_token,
      expires_at: DateTime.now()
        .plus({ seconds: tokenQuery.data.expires_in })
        .toJSDate(),
    };

    const repository = NotificationUserRepository.create();

    const discordUser = await fetchDiscordOauth2User(tokens.access_token!);

    const user = await repository.createUser({
      discord_user_id: discordUser.data.id,
      telegram_user_id: stateJson.tgId,
      tokens,
    });

    return reply.code(HTTPStatus.Ok).send(user);
  }
}
