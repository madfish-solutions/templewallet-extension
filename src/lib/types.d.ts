type nullish = null | undefined;

type HexString = `0x${string}`;

type JSONifiable = string | number | boolean | null | { [x: string]: JSONifiable | undefined } | JSONifiable[];

type EmptyFn = () => void;

type Defined<T> = Exclude<T, undefined>;

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

type SyncFn<T, R = void> = (arg: T) => R;

type StringRecord<T = string> = Record<string, T>;

/** A more strict way to use Record, while `noUncheckedIndexedAccess` is not turned on. */
type OptionalRecord<T = string> = {
  [key in string]?: T;
};

type NonEmptyArray<T> = [T, ...T[]];

type PropsWithChildren<P = unknown> = P & { children: import('react').ReactNode };
