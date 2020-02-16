export enum MessageTypes {
  PING = "THANOS_WALLET_PING",
  PONG = "THANOS_WALLET_PONG"
}

export type Messages = Ping | Pong;

export interface MessageBase {
  type: MessageTypes;
}

export interface Ping extends MessageBase {
  type: MessageTypes.PING;
}

export interface Pong extends MessageBase {
  type: MessageTypes.PONG;
}
