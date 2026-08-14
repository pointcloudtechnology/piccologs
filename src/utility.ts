export type Prettify<T> = { [K in keyof T]: T[K] } & {};

declare const brand: unique symbol;

export type Brand<T, Brand extends string> = T & { [brand]: Brand };
