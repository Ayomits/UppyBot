import { DateTime } from "luxon";

export function formatDate(date: string | Date) {
  const dateTime = DateTime.fromJSDate(new Date(date));
  return dateTime.toFormat("dd.MM.yyyy");
}
