import { HistoryAction, HistoryWithLastAction } from "./history";

export interface LocationState {
  pathname: string;
  search: string;
  hash: string;
  state: any;
  // History based props
  trigger: HistoryAction | null;
  historyLength: number;
  // Misc props
  host?: string;
  hostname?: string;
  href?: string;
  origin?: string;
  port?: string;
  protocol?: string;
}

export interface LocationUpdates {
  pathname?: string;
  search?: string;
  hash?: string;
  state?: any;
}

export type ModifyLocation = (location: LocationState) => LocationUpdates;

export function createLocationState(): LocationState {
  const {
    length: historyLength,
    lastAction: trigger = null,
    state
  } = window.history as HistoryWithLastAction;
  const {
    hash,
    host,
    hostname,
    href,
    origin,
    pathname,
    port,
    protocol,
    search
  } = window.location;

  return {
    trigger,
    historyLength,
    state,
    hash,
    host,
    hostname,
    href,
    origin,
    pathname,
    port,
    protocol,
    search
  };
}
