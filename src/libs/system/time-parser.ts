export function parseHHMMSS(timeString: string): number {
  const regex = /(\d{2}):(\d{2}):(\d{2})/;
  const match = timeString.match(regex);
  if (!match) throw new Error("Invalid time format");

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);

  return (hours * 3600 + minutes * 60 + seconds) * 1000;
}
