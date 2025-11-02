import { DateTime } from "luxon";

export function calculateDiffTime(curr: Date, diff: Date) {
  const { years, months, weeks, days, hours, minutes, seconds, milliseconds } =
    DateTime.fromJSDate(curr).diff(DateTime.fromJSDate(diff), [
      "years",
      "months",
      "weeks",
      "days",
      "hours",
      "minutes",
      "seconds",
      "milliseconds",
    ]);

  function format() {
    const toFormat: string[] = [];

    if (years > 0) {
      toFormat.push(`${Math.floor(years)} лет`);
    }

    if (months > 0) {
      toFormat.push(`${Math.floor(months)} месяцев`);
    }

    if (weeks > 0) {
      toFormat.push(`${Math.floor(weeks)} недель`);
    }

    if (days > 0) {
      toFormat.push(`${Math.floor(days)} дней`);
    }

    if (hours > 0) {
      toFormat.push(`${Math.floor(hours)} часов`);
    }

    if (minutes > 0) {
      toFormat.push(`${Math.floor(minutes)} минут`);
    }

    if (seconds > 0) {
      toFormat.push(`${Math.floor(seconds)} секунд`);
    }

    if (toFormat.length === 0) {
      toFormat.push(`${Math.floor(milliseconds)} милисекунд`);
    }

    return toFormat.join(" ");
  }

  return format();
}
