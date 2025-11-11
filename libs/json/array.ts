/* eslint-disable @typescript-eslint/no-explicit-any */
export function arraysEqual(arr1: any[], arr2: any[]) {
  return (
    arr1.length === arr2.length &&
    arr1.every((val, index) => val === arr2[index])
  );
}
