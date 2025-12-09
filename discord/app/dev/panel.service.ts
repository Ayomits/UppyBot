import {
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  heading,
  MessageFlags,
  ModalBuilder,
  type ModalSubmitInteraction,
  TextInputStyle,
  time,
  TimestampStyles,
} from "discord.js";
import { DateTime } from "luxon";
import { inject, injectable } from "tsyringe";

import { PromocodeModel } from "#/shared/db/models/uppy-discord/promocode.model.js";
import { createSafeCollector } from "#/shared/libs/djs/collector.js";
import { resolveTimestamp } from "#/shared/libs/embed/timestamp.js";
import { UsersUtility } from "#/shared/libs/embed/users.utility.js";
import { parseDuration } from "#/shared/libs/time/parse-duration.js";

import { PremiumSubscriptionManager } from "../premium/subscription-manager/subscription.service.js";
import { PromocodeService } from "../promocodes/promocode.service.js";
import { DevIds } from "./dev.const.js";

@injectable()
export class DevPanelService {
  constructor(
    @inject(PremiumSubscriptionManager)
    private premiumSubscriptionManager: PremiumSubscriptionManager,
    @inject(PromocodeService) private promocodeService: PromocodeService,
  ) {}

  async handlePanel(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const container = new ContainerBuilder()
      .addSectionComponents((builder) =>
        builder
          .addTextDisplayComponents((builder) =>
            builder.setContent(
              [heading("Добро пожаловать в панель разработчика")].join("\n"),
            ),
          )
          .setThumbnailAccessory((b) =>
            b.setURL(UsersUtility.getAvatar(interaction.user)),
          ),
      )
      .addSeparatorComponents((builder) => builder.setDivider(true))
      .addActionRowComponents((row) =>
        row.addComponents(
          this.createButton(
            "Создать промокод",
            DevIds.promocodes.create,
            ButtonStyle.Success,
          ),
          this.createButton(
            "Удалить промокод",
            DevIds.promocodes.revoke,
            ButtonStyle.Danger,
          ),
        ),
      )
      .addActionRowComponents((row) =>
        row.addComponents(
          this.createButton(
            "Выдать премиум",
            DevIds.premium.assign,
            ButtonStyle.Primary,
          ),
          this.createButton(
            "Забрать премиум",
            DevIds.premium.revoke,
            ButtonStyle.Secondary,
          ),
        ),
      );

    const collector = createSafeCollector(
      await interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }),
      {
        filter: (i) => i.user.id === interaction.user.id,
      },
    );

    collector.on("collect", (btn) => {
      if (!btn.isButton()) return;

      const type = btn.customId;
      const handlers = {
        [DevIds.promocodes.create]: () =>
          this.showPromocodeModal(btn, "create"),
        [DevIds.promocodes.revoke]: () =>
          this.showPromocodeModal(btn, "revoke"),
        [DevIds.premium.assign]: () => this.showPremiumModal(btn, "assign"),
        [DevIds.premium.revoke]: () => this.showPremiumModal(btn, "revoke"),
      } as const;

      return handlers[type as keyof typeof handlers]?.();
    });
  }

  async handlePromocodeModal(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const code = interaction.fields.getTextInputValue("code")?.trim();
    let activationsInput: string | null;
    let expiresInput: string | null;
    let durationInput: string | null;

    try {
      activationsInput = interaction.fields
        .getTextInputValue("activations")
        ?.trim();
    } catch {
      activationsInput = null;
    }

    try {
      expiresInput = interaction.fields.getTextInputValue("expires")?.trim();
    } catch {
      expiresInput = null;
    }

    try {
      durationInput = interaction.fields.getTextInputValue("duration")?.trim();
    } catch {
      durationInput = null;
    }

    if (!code) {
      return interaction.editReply({ content: "Укажите код промокода" });
    }

    const isCreation = interaction.customId === DevIds.promocodes.create;

    if (isCreation) {
      let activations: number;
      if (activationsInput && !isNaN(Number(activationsInput))) {
        activations = Math.max(1, Math.min(1000, Number(activationsInput)));
      } else {
        activations = 1;
      }

      let expiresMs: number | null = null;
      let durationMs: number | null = null;
      let expiresAt: Date | null = null;

      if (expiresInput) {
        expiresMs = parseDuration(expiresInput);
        if (!expiresMs) {
          return interaction.editReply({
            content: "Не удалось разобрать срок. Пример: 1h, 30m, 7d",
          });
        }
        expiresAt = DateTime.now().plus({ milliseconds: expiresMs }).toJSDate();
      }

      if (durationInput) {
        durationMs = parseDuration(durationInput);
        if (!durationMs) {
          return interaction.editReply({
            content: "Не удалось разобрать длительность. Пример: 1h, 30m, 7d",
          });
        }
      }

      await this.promocodeService.createOrUpdate({
        code,
        activations: activations,
        durationMs: durationMs!,
        expiresAt: expiresAt!,
      });

      let response = `Промокод \`${code}\` создан`;
      response += `\n• Активаций: ${activations}`;
      if (expiresAt) {
        response += `\n• Истекает: ${time(
          resolveTimestamp(expiresAt),
          TimestampStyles.RelativeTime,
        )}`;
      }

      return interaction.editReply({ content: response });
    }

    const removed = await PromocodeModel.model.findOneAndDelete({
      guildId: interaction.guildId,
      code,
    });

    if (!removed) {
      return interaction.editReply({
        content: "Промокод с таким кодом не найден",
      });
    }

    return interaction.editReply({
      content: `Промокод \`${code}\` удален`,
    });
  }

  private createButton(label: string, customId: string, style: ButtonStyle) {
    return new ButtonBuilder()
      .setLabel(label)
      .setCustomId(customId)
      .setStyle(style);
  }

  private async showPromocodeModal(
    interaction: ButtonInteraction,
    action: "create" | "revoke",
  ) {
    const modal = new ModalBuilder()
      .setTitle(
        action === "create" ? "Создание промокода" : "Удаление промокода",
      )
      .setCustomId(
        action === "create"
          ? DevIds.promocodes.create
          : DevIds.promocodes.revoke,
      )
      .addLabelComponents((builder) =>
        builder
          .setLabel("Код промокода")
          .setTextInputComponent((builder) =>
            builder
              .setCustomId("code")
              .setPlaceholder("Например: NEWYEAR2025")
              .setMinLength(3)
              .setMaxLength(50)
              .setRequired(true)
              .setStyle(TextInputStyle.Short),
          ),
      );

    if (action === "create") {
      modal
        .addLabelComponents((builder) =>
          builder
            .setLabel("Кол-во активаций")
            .setTextInputComponent((builder) =>
              builder
                .setCustomId("activations")
                .setPlaceholder("Например: 10")
                .setMinLength(1)
                .setMaxLength(10)
                .setRequired(true)
                .setStyle(TextInputStyle.Short),
            ),
        )
        .addLabelComponents((builder) =>
          builder
            .setLabel("Срок действия")
            .setTextInputComponent((builder) =>
              builder
                .setCustomId("expires")
                .setPlaceholder("Например: 1h")
                .setMinLength(2)
                .setRequired(true)
                .setStyle(TextInputStyle.Short),
            ),
        )
        .addLabelComponents((builder) =>
          builder
            .setLabel("Длительность после активации")
            .setTextInputComponent((builder) =>
              builder
                .setCustomId("duration")
                .setPlaceholder("Например: 1h")
                .setMinLength(2)
                .setRequired(true)
                .setStyle(TextInputStyle.Short),
            ),
        );
    }

    return interaction.showModal(modal);
  }

  private async showPremiumModal(
    interaction: ButtonInteraction,
    action: "assign" | "revoke",
  ) {
    const modal = new ModalBuilder()
      .setTitle(action === "assign" ? "Выдать премиум" : "Снять премиум")
      .setCustomId(
        action === "assign" ? DevIds.premium.assign : DevIds.premium.revoke,
      )
      .addLabelComponents((builder) =>
        builder.setLabel("ID сервера").setTextInputComponent((builder) =>
          builder
            .setCustomId("guildId")
            .setPlaceholder("Например: 123456789012345678")
            .setValue(interaction.guildId ?? "")
            .setRequired(true)
            .setStyle(TextInputStyle.Short),
        ),
      );

    if (action === "assign") {
      modal.addLabelComponents((builder) =>
        builder
          .setLabel("Срок (например: 1h, 30m, 7d)")
          .setTextInputComponent((builder) =>
            builder
              .setCustomId("duration")
              .setPlaceholder("1d 12h")
              .setRequired(true)
              .setStyle(TextInputStyle.Short),
          ),
      );
    }

    return interaction.showModal(modal);
  }

  async handlePremiumModal(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.fields.getTextInputValue("guildId")?.trim();
    let durationInput: string | null;

    try {
      durationInput = interaction.fields.getTextInputValue("duration")?.trim();
    } catch {
      durationInput = null;
    }

    if (!guildId) {
      return interaction.editReply({
        content: "Укажите ID сервера",
      });
    }

    const isAssign = interaction.customId === DevIds.premium.assign;

    if (isAssign) {
      const durationMs = parseDuration(durationInput!);
      if (!durationMs) {
        return interaction.editReply({
          content: "Не удалось разобрать срок. Пример: 1h, 30m, 7d",
        });
      }

      const existed =
        await this.premiumSubscriptionManager.findExisted(guildId);

      const expiresAt = existed
        ? DateTime.fromJSDate(existed.expiresAt)
        : DateTime.now();
      const newExpires = expiresAt
        .plus({ milliseconds: durationMs })
        .toJSDate();

      await this.premiumSubscriptionManager.reveal(guildId, newExpires);

      return interaction.editReply({
        content: `Премиум выдан до ${time(
          resolveTimestamp(newExpires),
          TimestampStyles.LongDateTime,
        )}`,
      });
    }

    await this.premiumSubscriptionManager.remove(guildId);

    return interaction.editReply({
      content: "Премиум был снят",
    });
  }
}
