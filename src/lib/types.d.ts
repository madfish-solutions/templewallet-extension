type nullish = null | undefined;

type JSONifiable = string | number | boolean | null | { [x: string]: JSONifiable | undefined } | JSONifiable[];

type EmptyFn = () => void;

type Defined<T> = Exclude<T, undefined>;

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

type SyncFn<T, R = void> = (arg: T) => R;

type StringRecord<T = string> = Record<string, T>;

interface PropsWithChildren {
  children: import('react').ReactNode;
}
