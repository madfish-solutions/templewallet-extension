type nullish = null | undefined;

type JSONifiable = string | number | boolean | null | { [x: string]: JSONifiable | undefined } | JSONifiable[];

type EmptyFn = () => void;

interface PropsWithChildren {
  children: import('react').ReactNode;
}
