export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const newObj = {} as Omit<T, K>;
  Object.entries(obj).forEach(([key, value]) => {
    if (!keys.includes(key as K)) {
      newObj[key as keyof Omit<T, K>] = value;
    }
  });
  return newObj;
}
