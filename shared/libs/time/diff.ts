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

    if (Math.abs(years) > 0) {
      toFormat.push(`${Math.floor(Math.abs(years))} лет`);
    }

    if (Math.abs(months) > 0) {
      toFormat.push(`${Math.floor(Math.abs(months))} месяцев`);
    }

    if (Math.abs(weeks) > 0) {
      toFormat.push(`${Math.floor(Math.abs(weeks))} недель`);
    }

    if (Math.abs(days) > 0) {
      toFormat.push(`${Math.floor(Math.abs(days))} дней`);
    }

    if (Math.abs(hours) > 0) {
      toFormat.push(`${Math.floor(Math.abs(hours))} часов`);
    }

    if (Math.abs(minutes) > 0) {
      toFormat.push(`${Math.floor(Math.abs(minutes))} минут`);
    }

    if (Math.abs(seconds) > 0) {
      toFormat.push(`${Math.floor(Math.abs(seconds))} секунд`);
    }

    if (toFormat.length === 0) {
      toFormat.push(`${Math.floor(Math.abs(milliseconds))} милисекунд`);
    }

    return toFormat.join(" ");
  }

  return format();
}
