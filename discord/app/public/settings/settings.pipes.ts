import { LabelBuilder, TextInputStyle } from "discord.js";

import {
  baseCommonRemindTemplate,
  baseForceRemindTemplate,
} from "#/discord/libs/templates/index.js";
import { GuildType } from "#/shared/db/models/uppy-discord/guild.model.js";
import type { SettingsDocument } from "#/shared/db/models/uppy-discord/settings.model.js";

import {
  brandinModalId,
  forceModalId,
  templateModalId,
} from "./settings.const.js";
import {
  baseConfigs,
  createConfig,
  createNumberInput,
  createPipeline,
  createPointsMonitoringConfig,
} from "./settings.utils.js";

// Напоминания
export const SettingsRemindsPipeline = createPipeline({
  enabled: createConfig(baseConfigs.toggle("remind.enabled", "Состояние")),
  pingRoles: createConfig(
    baseConfigs.multiRole("roles.pingRoles", "Роли для упоминаний"),
  ),
  managerRoles: createConfig(
    baseConfigs.multiRole("roles.managerRoles", "Роли с расширенными правами"),
  ),
  pingChannelId: createConfig(
    baseConfigs.singleChannel(
      "channels.pingChannelId",
      "Канал для напоминаний",
    ),
  ),
  bumpChannelId: createConfig(
    baseConfigs.singleChannel("channels.bumpChannelId", "Канал для команд"),
  ),
});

// Преждевременные напоминания
export const SettingsForceRemindsPipeline = createPipeline({
  enabled: createConfig(baseConfigs.toggle("force.enabled", "Состояние")),
  seconds: createConfig({
    label: "Секунд до преждевременного пинга",
    field: "force.seconds",
    type: "value" as const,
    modal: {
      customId: forceModalId,
      title: "Преждевременный пинг",
      fields: (settings: SettingsDocument) => [
        new LabelBuilder()
          .setLabel("Секунды")
          .setTextInputComponent(
            createNumberInput("value", settings.force?.seconds ?? 0),
          ),
      ],
    },
  }),
});

// Поинты
export const SettingsPointsPipeline = createPipeline({
  enabled: createConfig(baseConfigs.toggle("points.enabled", "Состояние")),
  dsMonitoring: createConfig(
    createPointsMonitoringConfig("dsMonitoring", "Ds monitoring"),
  ),
  disboard: createConfig(
    createPointsMonitoringConfig("disboard", "Disboard monitoring"),
  ),
  sdc: createConfig(createPointsMonitoringConfig("sdc", "Sdc monitoring")),
  server: createConfig(
    createPointsMonitoringConfig("server", "Server Monitoring"),
  ),
});

// KD система
export const SettingsKdPipeline = createPipeline({
  enabled: createConfig({
    access: GuildType.Premium,
    ...baseConfigs.toggle("kd.enabled", "Состояние"),
  }),
  dsMonitoring: createConfig({
    label: "Ds monitoring",
    field: "kd.dsMonitoring",
    type: "value" as const,
  }),
  disboard: createConfig({
    label: "Disboard monitoring",
    field: "kd.disboard",
    type: "value" as const,
  }),
  sdc: createConfig({
    label: "Sdc monitoring",
    field: "kd.sdc",
    type: "value" as const,
  }),
  server: createConfig({
    label: "Server Monitoring",
    field: "kd.server",
    type: "value" as const,
  }),
});

// Бамп баны
export const SettingsBumpBanPipeline = createPipeline({
  enabled: createConfig(baseConfigs.toggle("bumpBan.enabled", "Состояние")),
  roleId: createConfig({
    label: "Роль для бамп бана",
    field: "bumpBan.roleId",
    type: "role" as const,
    select: { choice: "single" as const, placeholder: "Выберите роль" },
  }),
});

// Телеграм
export const SettingsTelegramPipeline = createPipeline({
  enabled: createConfig(baseConfigs.toggle("telegram.enabled", "Состояние")),
});

// Брендирование
export const SettingsThemingPipeline = createPipeline({
  avatar: createConfig({
    modal: {
      customId: `${brandinModalId}_avatar`,
      fields: (settings) => [
        new LabelBuilder().setLabel("URL").setTextInputComponent((builder) =>
          builder
            .setCustomId("url")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(settings.theming?.banner ?? ""),
        ),
      ],
      title: "Аватар",
    },
    label: "Аватар",
    field: "theming.avatar",
    type: "value",
  }),
  banner: createConfig({
    modal: {
      customId: `${brandinModalId}_banner`,
      fields: (settings) => [
        new LabelBuilder().setLabel("URL").setTextInputComponent((builder) =>
          builder
            .setCustomId("url")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(settings.theming?.banner ?? ""),
        ),
      ],
      title: "Баннер",
    },
    label: "Баннер",
    field: "theming.banner",
    type: "value",
  }),
});

export const SettingsLoggingPipeline = createPipeline({
  // remindLogs: createConfig(
  //   baseConfigs.singleChannel("channels.remindLogs", "Логгирование напоминаний")
  // ),
  bumpBanLogs: createConfig(
    baseConfigs.singleChannel(
      "channels.bumpBanChannelId",
      "Логгирование бамп банов",
    ),
  ),
  commandLogs: createConfig(
    baseConfigs.singleChannel(
      "channels.commandChannelId",
      "Логгирование команд",
    ),
  ),
});

export const SettingsTemplatePipeline = createPipeline({
  common: createConfig({
    label: "Шаблон для обычных напоминаний",
    field: "templates.common",
    display: (settings) =>
      settings.templates?.common ?? baseCommonRemindTemplate,
    modal: {
      customId: `${templateModalId}_common`,
      fields: (settings) => [
        new LabelBuilder().setLabel("Шаблон").setTextInputComponent((builder) =>
          builder
            .setCustomId("template")
            .setPlaceholder(baseCommonRemindTemplate)
            .setMinLength(1)
            .setMaxLength(120)
            .setStyle(TextInputStyle.Short)
            .setValue(settings.templates.common ?? baseCommonRemindTemplate),
        ),
      ],
      title: "Шаблон для обычных напоминаний",
    },
    type: "value",
  }),
  force: createConfig({
    label: "Шаблон для преждевременных напоминаний",
    field: "templates.force",
    display: (settings) => settings.templates?.force ?? baseForceRemindTemplate,
    modal: {
      customId: `${templateModalId}_force`,
      fields: (settings) => [
        new LabelBuilder().setLabel("Шаблон").setTextInputComponent((builder) =>
          builder
            .setCustomId("template")
            .setPlaceholder(baseForceRemindTemplate)
            .setMinLength(1)
            .setMaxLength(120)
            .setStyle(TextInputStyle.Short)
            .setValue(settings.templates.force ?? baseForceRemindTemplate),
        ),
      ],
      title: "Шаблон для преждевременных напоминаний",
    },
    type: "value",
  }),
});

export const SettingsDevLogPipeline = createPipeline({
  premiumLogs: createConfig(
    baseConfigs.singleChannel(
      "dev.premiumLogs",
      "Логгирование премиума",
      GuildType.Developer,
    ),
  ),
  inviteLogs: createConfig(
    baseConfigs.singleChannel(
      "dev.inviteLogs",
      "Логгирование инвайтов",
      GuildType.Developer,
    ),
  ),
  remindLogs: createConfig(
    baseConfigs.singleChannel(
      "dev.remindLogs",
      "Логи напоминаний (чужих)",
      GuildType.Developer,
    ),
  ),
});
