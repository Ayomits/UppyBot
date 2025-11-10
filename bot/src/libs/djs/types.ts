export type ObjectKeys<T> = keyof T;
export type LiteralEnum<T> = T[ObjectKeys<T>];
