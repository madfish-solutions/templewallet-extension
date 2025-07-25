type nullish = null | undefined;

type HexString = `0x${string}`;

type JSONifiable = string | number | boolean | null | { [x: string]: JSONifiable | undefined } | JSONifiable[];

type EmptyFn = () => void;

type Defined<T> = Exclude<T, undefined>;

type PartiallyRequired<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>;

type SyncFn<T, R = void> = (arg: T) => R;

type StringRecord<T = string> = Record<string, T>;

/** A more strict way to use Record, while `noUncheckedIndexedAccess` is not turned on. */
type OptionalRecord<T = string> = {
  [key in string]?: T;
};

type NonEmptyArray<T> = [T, ...T[]];

type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

type NonNullableField<T, K extends keyof T> = T & NonNullableFields<Pick<T, K>>;

type ReactChildren = import('react').ReactNode | import('react').ReactNode[];

type PropsWithChildren<P = unknown> = P & { children: ReactChildren };

type PropsWithClassName<P = unknown> = P & { className?: string };

type Arguments<T> = T extends (...args: infer U) => any ? U : never;

type Replace<T, S1, S2> = Exclude<T, S1> extends never ? S2 : S1 extends T ? Exclude<T, S1> | S2 : T;

type ReactSetStateFn<T> = React.Dispatch<React.SetStateAction<T>>;
