export enum TransportType {
  /** Relies on `globalThis.u2f` interface. */
  U2F = 'u2f',
  /** Relies on `globalThis.navigator.hid` interface. */
  WEBHID = 'webhid',
  /** Relies on `globalThis.navigator.credentials` interface. */
  WEBAUTHN = 'webauthn'
}

export interface BridgeExchangeRequest {
  apdu: string;
  scrambleKey?: string;
  exchangeTimeout?: number;
  transportType: TransportType;
}
