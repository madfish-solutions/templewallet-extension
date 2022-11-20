/** From lodash */
type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T;

export const isTruthy = <T>(value: T): value is Truthy<T> => Boolean(value);

export const isNonNullable = <T>(value: T): value is NonNullable<T> => value != null;
