import { isDeepStrictEqual } from "node:util";

export function isJsonDifferent<T = object, K = object>(json1: T, json2: K) {
  return !isDeepStrictEqual(json1, json2);
}
