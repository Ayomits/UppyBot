import { DateTime } from 'luxon';

export const startDateValue = { hour: 0, minute: 0, second: 0, millisecond: 0 };
export const endDateValue = {
  hour: 23,
  minute: 59,
  second: 59,
  millisecond: 59,
};

export function normalizePeriod(start: Date, end: Date) {
  return {
    start: DateTime.fromJSDate(start).set(startDateValue).toJSDate(),
    end: DateTime.fromJSDate(end).set(endDateValue).toJSDate(),
  };
}

export function softPeriod(start: Date, end: Date) {
  if (start.getTime() < end.getTime()) {
    return {
      start,
      end,
    };
  }

  return {
    start: end,
    end: start,
  };
}
