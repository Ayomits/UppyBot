export class Time {
  static get second() {
    return 1_000;
  }

  static get minute() {
    return Time.second * 60;
  }

  static get hour() {
    return Time.minute * 60;
  }

  static get day() {
    return Time.hour * 24;
  }

  static get week() {
    return Time.day * 7;
  }

  static get month() {
    return Math.floor(365 / 12) * Time.day;
  }
}
