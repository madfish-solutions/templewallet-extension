export type EventFn<T, K = void> = (event: T) => K;
export type EventFnPromisable<T, K = void> = (event: T) => Promise<K>;
export type EmptyFn = () => void;
export const emptyFn = () => void 0;
export const emptyComponent = () => null;
