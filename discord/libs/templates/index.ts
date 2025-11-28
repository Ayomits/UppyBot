export const TemplateKeys = {
  PingRoles: "roles",
  Monitoring: "monitoring",
  Command: "command",
  Time: "time",
};

export const baseCommonRemindTemplate = `{${TemplateKeys.PingRoles}}, пора использовать команду {${TemplateKeys.Command}}`;
export const baseForceRemindTemplate = `{${TemplateKeys.PingRoles}} команда {${TemplateKeys.Command}} будет доступа {${TemplateKeys.Time}}`;

type TemplateVars = {
  roles: string[];
  command: string;
  time: string;
  monitoring: string;
};

/**
 *
 * @param roles массив с упоминаниями!
 * @param command упоминание команды!
 * @param time дискорд timestamp время
 * @param monitoring пинг бота!
 */
export function resolveTemplateMention(template: string, vars: TemplateVars) {
  return template
    .replaceAll(`{${TemplateKeys.PingRoles}}`, vars.roles.join(""))
    .replaceAll(`{${TemplateKeys.Command}}`, vars.command)
    .replaceAll(`{${TemplateKeys.Monitoring}}`, vars.monitoring)
    .replaceAll(`{${TemplateKeys.Time}}`, vars.time);
}
