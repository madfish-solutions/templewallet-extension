import { TZStatsNetwork } from "lib/tzstats";

export interface ThanosState {
  status: ThanosStatus;
  accounts: ThanosAccount[];
  networks: ThanosNetwork[];
}

export enum ThanosStatus {
  Idle,
  Locked,
  Ready
}

export interface ThanosAccount {
  type: ThanosAccountType;
  name: string;
  publicKeyHash: string;
}

export enum ThanosAccountType {
  HD,
  Imported,
  Connected
}

export interface ThanosNetwork {
  id: string | number;
  name: string;
  type: ThanosNetworkType;
  rpcBaseURL: string;
  tzStats: TZStatsNetwork;
  color: string;
  disabled: boolean;
}

export enum ThanosNetworkType {
  Main,
  Test
}

export enum ThanosMessageType {
  StateUpdated = "THANOS_STATE_UPDATED",
  GetStateRequest = "THANOS_GET_STATE_REQUEST",
  GetStateResponse = "THANOS_GET_STATE_RESPONSE",
  NewWalletRequest = "THANOS_NEW_WALLET_REQUEST",
  NewWalletResponse = "THANOS_NEW_WALLET_RESPONSE",
  UnlockRequest = "THANOS_UNLOCK_REQUEST",
  UnlockResponse = "THANOS_UNLOCK_RESPONSE",
  LockRequest = "THANOS_LOCK_REQUEST",
  LockResponse = "THANOS_LOCK_RESPONSE",
  CreateAccountRequest = "THANOS_CREATE_ACCOUNT_REQUEST",
  CreateAccountResponse = "THANOS_CREATE_ACCOUNT_RESPONSE",
  RevealPrivateKeyRequest = "THANOS_REVEAL_PRIVATE_KEY_REQUEST",
  RevealPrivateKeyResponse = "THANOS_REVEAL_PRIVATE_KEY_RESPONSE",
  RevealMnemonicRequest = "THANOS_REVEAL_MNEMONIC_REQUEST",
  RevealMnemonicResponse = "THANOS_REVEAL_MNEMONIC_RESPONSE",
  EditAccountRequest = "THANOS_EDIT_ACCOUNT_REQUEST",
  EditAccountResponse = "THANOS_EDIT_ACCOUNT_RESPONSE",
  ImportAccountRequest = "THANOS_IMPORT_ACCOUNT_REQUEST",
  ImportAccountResponse = "THANOS_IMPORT_ACCOUNT_RESPONSE",
  ImportFundraiserAccountRequest = "THANOS_IMPORT_FUNDRAISER_ACCOUNT_REQUEST",
  ImportFundraiserAccountResponse = "THANOS_IMPORT_FUNDRAISER_ACCOUNT_RESPONSE",
  SignRequest = "THANOS_SIGN_REQUEST",
  SignResponse = "THANOS_SIGN_RESPONSE"
}

export type ThanosRequest =
  | ThanosGetStateRequest
  | ThanosNewWalletRequest
  | ThanosUnlockRequest
  | ThanosLockRequest
  | ThanosCreateAccountRequest
  | ThanosRevealPrivateKeyRequest
  | ThanosRevealMnemonicRequest
  | ThanosEditAccountRequest
  | ThanosImportAccountRequest
  | ThanosImportFundraiserAccountRequest
  | ThanosSignRequest;

export type ThanosResponse =
  | ThanosGetStateResponse
  | ThanosNewWalletResponse
  | ThanosUnlockResponse
  | ThanosLockResponse
  | ThanosCreateAccountResponse
  | ThanosRevealPrivateKeyResponse
  | ThanosRevealMnemonicResponse
  | ThanosEditAccountResponse
  | ThanosImportAccountResponse
  | ThanosImportFundraiserAccountResponse
  | ThanosSignResponse;

export interface ThanosMessageBase {
  type: ThanosMessageType;
}

export interface ThanosGetStateRequest extends ThanosMessageBase {
  type: ThanosMessageType.GetStateRequest;
}

export interface ThanosGetStateResponse extends ThanosMessageBase {
  type: ThanosMessageType.GetStateResponse;
  state: ThanosState;
}

export interface ThanosNewWalletRequest extends ThanosMessageBase {
  type: ThanosMessageType.NewWalletRequest;
  password: string;
  mnemonic?: string;
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

export interface ThanosRevealPrivateKeyRequest extends ThanosMessageBase {
  type: ThanosMessageType.RevealPrivateKeyRequest;
  accountIndex: number;
  password: string;
}

export interface ThanosRevealPrivateKeyResponse extends ThanosMessageBase {
  type: ThanosMessageType.RevealPrivateKeyResponse;
  privateKey: string;
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

export interface ThanosImportAccountRequest extends ThanosMessageBase {
  type: ThanosMessageType.ImportAccountRequest;
  privateKey: string;
}

export interface ThanosImportAccountResponse extends ThanosMessageBase {
  type: ThanosMessageType.ImportAccountResponse;
}

export interface ThanosImportFundraiserAccountRequest
  extends ThanosMessageBase {
  type: ThanosMessageType.ImportFundraiserAccountRequest;
  email: string;
  password: string;
  mnemonic: string;
}

export interface ThanosImportFundraiserAccountResponse
  extends ThanosMessageBase {
  type: ThanosMessageType.ImportFundraiserAccountResponse;
}

export interface ThanosSignRequest extends ThanosMessageBase {
  type: ThanosMessageType.SignRequest;
  accountIndex: number;
  bytes: string;
  watermark?: Uint8Array;
}

export interface ThanosSignResponse extends ThanosMessageBase {
  type: ThanosMessageType.SignResponse;
  result: any;
}
