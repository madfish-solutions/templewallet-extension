type nullish = null | undefined;

type JSONifiable = string | number | boolean | null | { [x: string]: JSONifiable | undefined } | JSONifiable[];

type EmptyFn = () => void;
