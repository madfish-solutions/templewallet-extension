type nullish = null | undefined;

type JSONifiable = string | number | boolean | null | { [x: string]: JSONifiable | undefined } | JSONifiable[];

type EmptyFn = () => void;

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

interface PropsWithChildren {
  children: import('react').ReactNode;
}
