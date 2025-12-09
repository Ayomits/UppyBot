import { Time } from "./time.js";

const units: Record<string, number> = {
  s: Time.second,
  sec: Time.second,
  m: Time.minute,
  min: Time.minute,
  h: Time.hour,
  hr: Time.hour,
  d: Time.day,
  day: Time.day,
  w: Time.week,
  wk: Time.week,
  week: Time.week,
  mo: Time.month,
  mon: Time.month,
  y: Time.day * 365,
  yr: Time.day * 365,
  year: Time.day * 365,
};

/**
 * Parse human-readable duration like "1h 30m" into milliseconds.
 * Returns null if the input cannot be parsed.
 */
export function parseDuration(input: string): number | null {
  if (!input) return null;

  const matches = [...input.toLowerCase().matchAll(/(\d+(?:\.\d+)?)([a-z]+)/g)];
  if (matches.length === 0) return null;

  let total = 0;

  for (const [, value, unit] of matches) {
    const ms = units[unit];
    if (!ms) return null;
    total += Number(value) * ms;
  }

  return total > 0 ? total : null;
}
