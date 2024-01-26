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

/**
 * This state is used to prevent glitches of tracking operation with TZKT in case we decide to switch
 * accounts without moving to home page
 */
interface OperationState {
  operation: import('@taquito/taquito').WalletOperation;
  sender: string;
}
