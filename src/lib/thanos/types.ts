export interface ThanosFrontState {
  status: ThanosStatus;
  account: ThanosAccount | null;
}

export enum ThanosStatus {
  Idle,
  Locked,
  Ready
}

export interface ThanosAccount {
  publicKeyHash: string;
}

export enum ThanosMessageType {
  StateUpdated = "THANOS_WALLET_STATE_UPDATED",
  GetStateRequest = "THANOS_WALLET_GET_STATE_REQUEST",
  GetStateResponse = "THANOS_WALLET_GET_STATE_RESPONSE",
  NewWalletRequest = "THANOS_WALLET_NEW_WALLET_REQUEST",
  NewWalletResponse = "THANOS_WALLET_NEW_WALLET_RESPONSE",
  UnlockRequest = "THANOS_WALLET_UNLOCK_REQUEST",
  UnlockResponse = "THANOS_WALLET_UNLOCK_RESPONSE"
}

export type ThanosRequest =
  | ThanosGetStateRequest
  | ThanosNewWalletRequest
  | ThanosUnlockRequest;

export type ThanosResponse =
  | ThanosGetStateResponse
  | ThanosNewWalletResponse
  | ThanosUnlockResponse;

export interface ThanosMessageBase {
  type: ThanosMessageType;
}

export interface ThanosGetStateRequest extends ThanosMessageBase {
  type: ThanosMessageType.GetStateRequest;
}

export interface ThanosGetStateResponse extends ThanosMessageBase {
  type: ThanosMessageType.GetStateResponse;
  state: ThanosFrontState;
}

export interface ThanosNewWalletRequest extends ThanosMessageBase {
  type: ThanosMessageType.NewWalletRequest;
  mnemonic: string;
  password: string;
}

export interface ThanosNewWalletResponse extends ThanosMessageBase {
  type: ThanosMessageType.NewWalletResponse;
}

export interface ThanosUnlockRequest extends ThanosMessageBase {
  type: ThanosMessageType.UnlockRequest;
  password: string;
}

export interface ThanosUnlockResponse extends ThanosMessageBase {
  type: ThanosMessageType.UnlockResponse;
}
