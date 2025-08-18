export function isJsonDifferent<T = object, K = object>(json1: T, json2: K) {
  return JSON.stringify(json1) === JSON.stringify(json2);
}
