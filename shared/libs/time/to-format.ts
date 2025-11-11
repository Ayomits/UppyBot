import { DateTime } from "luxon";

export function formatDate(
  date: string | Date,
  format: "dd.MM.yy" | "dd.MM.yyyy" = "dd.MM.yy"
) {
  const dateTime = DateTime.fromJSDate(new Date(date));
  return dateTime.toFormat(format);
}
