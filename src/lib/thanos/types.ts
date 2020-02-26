export interface ThanosFrontState {
  status: ThanosStatus;
  accounts: ThanosAccount[];
}

export enum ThanosStatus {
  Idle,
  Locked,
  Ready
}

export interface ThanosAccount {
  name: string;
  publicKeyHash: string;
}

export enum ThanosMessageType {
  StateUpdated = "THANOS_WALLET_STATE_UPDATED",
  GetStateRequest = "THANOS_WALLET_GET_STATE_REQUEST",
  GetStateResponse = "THANOS_WALLET_GET_STATE_RESPONSE",
  NewWalletRequest = "THANOS_WALLET_NEW_WALLET_REQUEST",
  NewWalletResponse = "THANOS_WALLET_NEW_WALLET_RESPONSE",
  UnlockRequest = "THANOS_WALLET_UNLOCK_REQUEST",
  UnlockResponse = "THANOS_WALLET_UNLOCK_RESPONSE",
  LockRequest = "THANOS_WALLET_LOCK_REQUEST",
  LockResponse = "THANOS_WALLET_LOCK_RESPONSE",
  CreateAccountRequest = "THANOS_WALLET_CREATE_ACCOUNT_REQUEST",
  CreateAccountResponse = "THANOS_WALLET_CREATE_ACCOUNT_RESPONSE",
  RevealMnemonicRequest = "THANOS_WALLET_REVEAL_MNEMONIC_REQUEST",
  RevealMnemonicResponse = "THANOS_WALLET_REVEAL_MNEMONIC_RESPONSE",
  EditAccountRequest = "THANOS_WALLET_EDIT_ACCOUNT_REQUEST",
  EditAccountResponse = "THANOS_WALLET_EDIT_ACCOUNT_RESPONSE"
}

export type ThanosRequest =
  | ThanosGetStateRequest
  | ThanosNewWalletRequest
  | ThanosUnlockRequest
  | ThanosLockRequest
  | ThanosCreateAccountRequest
  | ThanosRevealMnemonicRequest
  | ThanosEditAccountRequest;

export type ThanosResponse =
  | ThanosGetStateResponse
  | ThanosNewWalletResponse
  | ThanosUnlockResponse
  | ThanosLockResponse
  | ThanosCreateAccountResponse
  | ThanosRevealMnemonicResponse
  | ThanosEditAccountResponse;

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

export interface ThanosLockRequest extends ThanosMessageBase {
  type: ThanosMessageType.LockRequest;
}

export interface ThanosLockResponse extends ThanosMessageBase {
  type: ThanosMessageType.LockResponse;
}

export interface ThanosCreateAccountRequest extends ThanosMessageBase {
  type: ThanosMessageType.CreateAccountRequest;
}

export interface ThanosCreateAccountResponse extends ThanosMessageBase {
  type: ThanosMessageType.CreateAccountResponse;
}

export interface ThanosRevealMnemonicRequest extends ThanosMessageBase {
  type: ThanosMessageType.RevealMnemonicRequest;
  password: string;
}

export interface ThanosRevealMnemonicResponse extends ThanosMessageBase {
  type: ThanosMessageType.RevealMnemonicResponse;
  mnemonic: string;
}

export interface ThanosEditAccountRequest extends ThanosMessageBase {
  type: ThanosMessageType.EditAccountRequest;
  accountIndex: number;
  name: string;
}

export interface ThanosEditAccountResponse extends ThanosMessageBase {
  type: ThanosMessageType.EditAccountResponse;
}
