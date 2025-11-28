export function resolveTimestamp(date: Date) {
  return Math.floor(date.getTime() / 1_000);
}
