import { DateTime } from "luxon";

export function formatDate(date: Date) {
  return DateTime.fromJSDate(date).toFormat("dd.MM.yy");
}
