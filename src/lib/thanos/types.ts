import { TZStatsNetwork } from "lib/tzstats";

type NonEmptyArray<T> = [T, ...T[]];

export interface ReadyThanosState extends ThanosState {
  status: ThanosStatus.Ready;
  accounts: NonEmptyArray<ThanosAccount>;
  networks: NonEmptyArray<ThanosNetwork>;
  settings: ThanosSettings;
}

export interface ThanosState {
  status: ThanosStatus;
  accounts: ThanosAccount[];
  networks: ThanosNetwork[];
  settings: ThanosSettings | null;
}

export enum ThanosStatus {
  Idle,
  Locked,
  Ready,
}

export interface ThanosAccount {
  type: ThanosAccountType;
  name: string;
  publicKeyHash: string;
}

export enum ThanosAccountType {
  HD,
  Imported,
  Connected,
}

export interface ThanosNetwork {
  id: string;
  name: string;
  description: string;
  type: ThanosNetworkType;
  rpcBaseURL: string;
  tzStats: TZStatsNetwork;
  color: string;
  disabled: boolean;
}

export type ThanosNetworkType = "main" | "test";

export interface ThanosSettings {
  dAppEnabled: boolean;
}

export enum ThanosMessageType {
  StateUpdated = "THANOS_STATE_UPDATED",
  ConfirmRequested = "THANOS_CONFIRM_REQUESTED",
  ConfirmExpired = "THANOS_CONFIRM_EXPIRED",
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
  RevealPublicKeyRequest = "THANOS_REVEAL_PUBLIC_KEY_REQUEST",
  RevealPublicKeyResponse = "THANOS_REVEAL_PUBLIC_KEY_RESPONSE",
  RevealPrivateKeyRequest = "THANOS_REVEAL_PRIVATE_KEY_REQUEST",
  RevealPrivateKeyResponse = "THANOS_REVEAL_PRIVATE_KEY_RESPONSE",
  RevealMnemonicRequest = "THANOS_REVEAL_MNEMONIC_REQUEST",
  RevealMnemonicResponse = "THANOS_REVEAL_MNEMONIC_RESPONSE",
  RemoveAccountRequest = "THANOS_REMOVE_ACCOUNT_REQUEST",
  RemoveAccountResponse = "THANOS_REMOVE_ACCOUNT_RESPONSE",
  EditAccountRequest = "THANOS_EDIT_ACCOUNT_REQUEST",
  EditAccountResponse = "THANOS_EDIT_ACCOUNT_RESPONSE",
  ImportAccountRequest = "THANOS_IMPORT_ACCOUNT_REQUEST",
  ImportAccountResponse = "THANOS_IMPORT_ACCOUNT_RESPONSE",
  ImportMnemonicAccountRequest = "THANOS_IMPORT_MNEMONIC_ACCOUNT_REQUEST",
  ImportMnemonicAccountResponse = "THANOS_IMPORT_MNEMONIC_ACCOUNT_RESPONSE",
  ImportFundraiserAccountRequest = "THANOS_IMPORT_FUNDRAISER_ACCOUNT_REQUEST",
  ImportFundraiserAccountResponse = "THANOS_IMPORT_FUNDRAISER_ACCOUNT_RESPONSE",
  UpdateSettingsRequest = "THANOS_UPDATE_SETTINGS_REQUEST",
  UpdateSettingsResponse = "THANOS_UPDATE_SETTINGS_RESPONSE",
  SignRequest = "THANOS_SIGN_REQUEST",
  SignResponse = "THANOS_SIGN_RESPONSE",
  ConfirmRequest = "THANOS_CONFIRM_REQUEST",
  ConfirmResponse = "THANOS_CONFIRM_RESPONSE",
  PageRequest = "THANOS_PAGE_REQUEST",
  PageResponse = "THANOS_PAGE_RESPONSE",
  DAppPermissionConfirmRequest = "THANOS_DAPP_PERMISSION_CONFIRM_REQUEST",
  DAppPermissionConfirmResponse = "THANOS_DAPP_PERMISSION_CONFIRM_RESPONSE",
  DAppOperationConfirmRequest = "THANOS_DAPP_OPERATION_CONFIRM_REQUEST",
  DAppOperationConfirmResponse = "THANOS_DAPP_OPERATION_CONFIRM_RESPONSE",
}

export type ThanosRequest =
  | ThanosGetStateRequest
  | ThanosNewWalletRequest
  | ThanosUnlockRequest
  | ThanosLockRequest
  | ThanosCreateAccountRequest
  | ThanosRevealPublicKeyRequest
  | ThanosRevealPrivateKeyRequest
  | ThanosRevealMnemonicRequest
  | ThanosEditAccountRequest
  | ThanosImportAccountRequest
  | ThanosImportMnemonicAccountRequest
  | ThanosImportFundraiserAccountRequest
  | ThanosSignRequest
  | ThanosConfirmRequest
  | ThanosRemoveAccountRequest
  | ThanosPageRequest
  | ThanosDAppPermissionConfirmRequest
  | ThanosDAppOperationConfirmRequest
  | ThanosUpdateSettingsRequest;

export type ThanosResponse =
  | ThanosGetStateResponse
  | ThanosNewWalletResponse
  | ThanosUnlockResponse
  | ThanosLockResponse
  | ThanosCreateAccountResponse
  | ThanosRevealPublicKeyResponse
  | ThanosRevealPrivateKeyResponse
  | ThanosRevealMnemonicResponse
  | ThanosEditAccountResponse
  | ThanosImportAccountResponse
  | ThanosImportMnemonicAccountResponse
  | ThanosImportFundraiserAccountResponse
  | ThanosSignResponse
  | ThanosConfirmResponse
  | ThanosRemoveAccountResponse
  | ThanosPageResponse
  | ThanosDAppPermissionConfirmResponse
  | ThanosDAppOperationConfirmResponse
  | ThanosUpdateSettingsResponse;

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
  name?: string;
}

export interface ThanosCreateAccountResponse extends ThanosMessageBase {
  type: ThanosMessageType.CreateAccountResponse;
}

export interface ThanosRevealPublicKeyRequest extends ThanosMessageBase {
  type: ThanosMessageType.RevealPublicKeyRequest;
  accountPublicKeyHash: string;
}

export interface ThanosRevealPublicKeyResponse extends ThanosMessageBase {
  type: ThanosMessageType.RevealPublicKeyResponse;
  publicKey: string;
}

export interface ThanosRevealPrivateKeyRequest extends ThanosMessageBase {
  type: ThanosMessageType.RevealPrivateKeyRequest;
  accountPublicKeyHash: string;
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

export interface ThanosRemoveAccountRequest extends ThanosMessageBase {
  type: ThanosMessageType.RemoveAccountRequest;
  accountPublicKeyHash: string;
  password: string;
}

export interface ThanosRemoveAccountResponse extends ThanosMessageBase {
  type: ThanosMessageType.RemoveAccountResponse;
}

export interface ThanosEditAccountRequest extends ThanosMessageBase {
  type: ThanosMessageType.EditAccountRequest;
  accountPublicKeyHash: string;
  name: string;
}

export interface ThanosEditAccountResponse extends ThanosMessageBase {
  type: ThanosMessageType.EditAccountResponse;
}

export interface ThanosImportAccountRequest extends ThanosMessageBase {
  type: ThanosMessageType.ImportAccountRequest;
  privateKey: string;
  encPassword?: string;
}

export interface ThanosImportAccountResponse extends ThanosMessageBase {
  type: ThanosMessageType.ImportAccountResponse;
}

export interface ThanosImportMnemonicAccountRequest extends ThanosMessageBase {
  type: ThanosMessageType.ImportMnemonicAccountRequest;
  mnemonic: string;
  password?: string;
  derivationPath?: string;
}

export interface ThanosImportMnemonicAccountResponse extends ThanosMessageBase {
  type: ThanosMessageType.ImportMnemonicAccountResponse;
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

export interface ThanosUpdateSettingsRequest extends ThanosMessageBase {
  type: ThanosMessageType.UpdateSettingsRequest;
  settings: Partial<ThanosSettings>;
}

export interface ThanosUpdateSettingsResponse extends ThanosMessageBase {
  type: ThanosMessageType.UpdateSettingsResponse;
}

export interface ThanosSignRequest extends ThanosMessageBase {
  type: ThanosMessageType.SignRequest;
  accountPublicKeyHash: string;
  id: string;
  bytes: string;
  watermark?: string;
}

export interface ThanosSignResponse extends ThanosMessageBase {
  type: ThanosMessageType.SignResponse;
  result: any;
}

export interface ThanosConfirmRequest extends ThanosMessageBase {
  type: ThanosMessageType.ConfirmRequest;
  id: string;
  confirm: boolean;
  password?: string;
}

export interface ThanosConfirmResponse extends ThanosMessageBase {
  type: ThanosMessageType.ConfirmResponse;
  id: string;
}

export interface ThanosPageRequest extends ThanosMessageBase {
  type: ThanosMessageType.PageRequest;
  origin: string;
  payload: any;
}

export interface ThanosPageResponse extends ThanosMessageBase {
  type: ThanosMessageType.PageResponse;
  payload: any;
}

export interface ThanosDAppPermissionConfirmRequest extends ThanosMessageBase {
  type: ThanosMessageType.DAppPermissionConfirmRequest;
  id: string;
  confirm: boolean;
  pkh?: string;
}

export interface ThanosDAppPermissionConfirmResponse extends ThanosMessageBase {
  type: ThanosMessageType.DAppPermissionConfirmResponse;
  id: string;
}

export interface ThanosDAppOperationConfirmRequest extends ThanosMessageBase {
  type: ThanosMessageType.DAppOperationConfirmRequest;
  id: string;
  confirm: boolean;
  password?: string;
}

export interface ThanosDAppOperationConfirmResponse extends ThanosMessageBase {
  type: ThanosMessageType.DAppOperationConfirmResponse;
  id: string;
}
