import { OperationContentsAndResult } from "@taquito/rpc";
import { ThanosDAppMetadata } from "@thanos-wallet/dapp/dist/types";
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
  tzStats: TZStatsNetwork | null;
  color: string;
  disabled: boolean;
}

export type ThanosAsset = ThanosXTZAsset | ThanosToken;

export type ThanosToken =
  | ThanosTzBTCAsset
  | ThanosStakerAsset
  | ThanosFA1_2Asset
  | ThanosFA2Asset;

export enum ThanosAssetType {
  XTZ = "XTZ",
  TzBTC = "TzBTC",
  Staker = "STAKER",
  FA1_2 = "FA1_2",
  FA2 = "FA2",
}

export interface ThanosAssetBase {
  type: ThanosAssetType;
  decimals: number;
  symbol: string;
  name: string;
  fungible: boolean;
  default?: boolean;
}

export interface ThanosTokenBase extends ThanosAssetBase {
  address: string;
  iconUrl?: string;
}

export interface ThanosXTZAsset extends ThanosAssetBase {
  type: ThanosAssetType.XTZ;
}

export interface ThanosTzBTCAsset extends ThanosTokenBase {
  type: ThanosAssetType.TzBTC;
}

export interface ThanosStakerAsset extends ThanosTokenBase {
  type: ThanosAssetType.Staker;
}

export interface ThanosFA1_2Asset extends ThanosTokenBase {
  type: ThanosAssetType.FA1_2;
}

export interface ThanosFA2Asset extends ThanosTokenBase {
  type: ThanosAssetType.FA2;
}

export type ThanosNetworkType = "main" | "test";

export interface ThanosSettings {
  customNetworks?: ThanosNetwork[];
}

export enum ThanosSharedStorageKey {
  DAppEnabled = "dappenabled",
}

export type ThanosPendingOperation = OperationContentsAndResult & {
  hash: string;
  addedAt: string;
};

/**
 * Internal confirmation payloads
 */
export interface ThanosConfirmationPayloadBase {
  type: string;
  sourcePkh: string;
}

export interface ThanosSignConfirmationPayload
  extends ThanosConfirmationPayloadBase {
  type: "sign";
  bytes: string;
  watermark?: string;
}

export interface ThanosOpsConfirmationPayload
  extends ThanosConfirmationPayloadBase {
  type: "operations";
  networkRpc: string;
  opParams: any[];
}

export type ThanosConfirmationPayload =
  | ThanosSignConfirmationPayload
  | ThanosOpsConfirmationPayload;

/**
 * DApp confirmation payloads
 */

export interface ThanosDAppPayloadBase {
  type: string;
  origin: string;
  networkRpc: string;
  appMeta: ThanosDAppMetadata;
}

export interface ThanosDAppConnectPayload extends ThanosDAppPayloadBase {
  type: "connect";
}

export interface ThanosDAppOperationsPayload extends ThanosDAppPayloadBase {
  type: "confirm_operations";
  sourcePkh: string;
  opParams: any[];
}

export interface ThanosDAppSignPayload extends ThanosDAppPayloadBase {
  type: "sign";
  sourcePkh: string;
  payload: string;
  preview: any;
}

export type ThanosDAppPayload =
  | ThanosDAppConnectPayload
  | ThanosDAppOperationsPayload
  | ThanosDAppSignPayload;

/**
 * Messages
 */

export enum ThanosMessageType {
  // Notifications
  StateUpdated = "THANOS_STATE_UPDATED",
  ConfirmationRequested = "THANOS_CONFIRMATION_REQUESTED",
  ConfirmationExpired = "THANOS_CONFIRMATION_EXPIRED",
  // Request-Response pairs
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
  GetAllPndOpsRequest = "THANOS_GET_ALL_PND_OPS_REQUEST",
  GetAllPndOpsResponse = "THANOS_GET_ALL_PND_OPS_RESPONSE",
  RemovePndOpsRequest = "THANOS_REMOVE_PND_OPS_REQUEST",
  RemovePndOpsResponse = "THANOS_REMOVE_PND_OPS_RESPONSE",
  OperationsRequest = "THANOS_OPERATIONS_REQUEST",
  OperationsResponse = "THANOS_OPERATIONS_RESPONSE",
  SignRequest = "THANOS_SIGN_REQUEST",
  SignResponse = "THANOS_SIGN_RESPONSE",
  ConfirmationRequest = "THANOS_CONFIRMATION_REQUEST",
  ConfirmationResponse = "THANOS_CONFIRMATION_RESPONSE",
  PageRequest = "THANOS_PAGE_REQUEST",
  PageResponse = "THANOS_PAGE_RESPONSE",
  DAppGetPayloadRequest = "THANOS_DAPP_GET_PAYLOAD_REQUEST",
  DAppGetPayloadResponse = "THANOS_DAPP_GET_PAYLOAD_RESPONSE",
  DAppPermConfirmationRequest = "THANOS_DAPP_PERM_CONFIRMATION_REQUEST",
  DAppPermConfirmationResponse = "THANOS_DAPP_PERM_CONFIRMATION_RESPONSE",
  DAppOpsConfirmationRequest = "THANOS_DAPP_OPS_CONFIRMATION_REQUEST",
  DAppOpsConfirmationResponse = "THANOS_DAPP_OPS_CONFIRMATION_RESPONSE",
  DAppSignConfirmationRequest = "THANOS_DAPP_SIGN_CONFIRMATION_REQUEST",
  DAppSignConfirmationResponse = "THANOS_DAPP_SIGN_CONFIRMATION_RESPONSE",
}

export type ThanosNotification =
  | ThanosStateUpdated
  | ThanosConfirmationRequested
  | ThanosConfirmationExpired;

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
  | ThanosOperationsRequest
  | ThanosSignRequest
  | ThanosConfirmationRequest
  | ThanosRemoveAccountRequest
  | ThanosPageRequest
  | ThanosDAppGetPayloadRequest
  | ThanosDAppPermConfirmationRequest
  | ThanosDAppOpsConfirmationRequest
  | ThanosDAppSignConfirmationRequest
  | ThanosUpdateSettingsRequest
  | ThanosGetAllPndOpsRequest
  | ThanosRemovePndOpsRequest;

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
  | ThanosOperationsResponse
  | ThanosSignResponse
  | ThanosConfirmationResponse
  | ThanosRemoveAccountResponse
  | ThanosPageResponse
  | ThanosDAppGetPayloadResponse
  | ThanosDAppPermConfirmationResponse
  | ThanosDAppOpsConfirmationResponse
  | ThanosDAppSignConfirmationResponse
  | ThanosUpdateSettingsResponse
  | ThanosGetAllPndOpsResponse
  | ThanosRemovePndOpsResponse;

export interface ThanosMessageBase {
  type: ThanosMessageType;
}

export interface ThanosStateUpdated extends ThanosMessageBase {
  type: ThanosMessageType.StateUpdated;
}

export interface ThanosConfirmationRequested extends ThanosMessageBase {
  type: ThanosMessageType.ConfirmationRequested;
  id: string;
  payload: ThanosConfirmationPayload;
}

export interface ThanosConfirmationExpired extends ThanosMessageBase {
  type: ThanosMessageType.ConfirmationExpired;
  id: string;
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

export interface ThanosGetAllPndOpsRequest extends ThanosMessageBase {
  type: ThanosMessageType.GetAllPndOpsRequest;
  accountPublicKeyHash: string;
  netId: string;
}

export interface ThanosGetAllPndOpsResponse extends ThanosMessageBase {
  type: ThanosMessageType.GetAllPndOpsResponse;
  operations: ThanosPendingOperation[];
}

export interface ThanosRemovePndOpsRequest extends ThanosMessageBase {
  type: ThanosMessageType.RemovePndOpsRequest;
  accountPublicKeyHash: string;
  netId: string;
  opHashes: string[];
}

export interface ThanosRemovePndOpsResponse extends ThanosMessageBase {
  type: ThanosMessageType.RemovePndOpsResponse;
}

export interface ThanosOperationsRequest extends ThanosMessageBase {
  type: ThanosMessageType.OperationsRequest;
  id: string;
  sourcePkh: string;
  networkRpc: string;
  opParams: any[];
}

export interface ThanosOperationsResponse extends ThanosMessageBase {
  type: ThanosMessageType.OperationsResponse;
  opHash: string;
}

export interface ThanosSignRequest extends ThanosMessageBase {
  type: ThanosMessageType.SignRequest;
  id: string;
  sourcePkh: string;
  bytes: string;
  watermark?: string;
}

export interface ThanosSignResponse extends ThanosMessageBase {
  type: ThanosMessageType.SignResponse;
  result: any;
}

export interface ThanosConfirmationRequest extends ThanosMessageBase {
  type: ThanosMessageType.ConfirmationRequest;
  id: string;
  confirmed: boolean;
}

export interface ThanosConfirmationResponse extends ThanosMessageBase {
  type: ThanosMessageType.ConfirmationResponse;
}

export interface ThanosPageRequest extends ThanosMessageBase {
  type: ThanosMessageType.PageRequest;
  origin: string;
  payload: any;
  beacon?: boolean;
}

export interface ThanosPageResponse extends ThanosMessageBase {
  type: ThanosMessageType.PageResponse;
  payload: any;
}

export interface ThanosDAppGetPayloadRequest extends ThanosMessageBase {
  type: ThanosMessageType.DAppGetPayloadRequest;
  id: string;
}

export interface ThanosDAppGetPayloadResponse extends ThanosMessageBase {
  type: ThanosMessageType.DAppGetPayloadResponse;
  payload: ThanosDAppPayload;
}

export interface ThanosDAppPermConfirmationRequest extends ThanosMessageBase {
  type: ThanosMessageType.DAppPermConfirmationRequest;
  id: string;
  confirmed: boolean;
  accountPublicKey: string;
  accountPublicKeyHash: string;
}

export interface ThanosDAppPermConfirmationResponse extends ThanosMessageBase {
  type: ThanosMessageType.DAppPermConfirmationResponse;
}

export interface ThanosDAppOpsConfirmationRequest extends ThanosMessageBase {
  type: ThanosMessageType.DAppOpsConfirmationRequest;
  id: string;
  confirmed: boolean;
}

export interface ThanosDAppOpsConfirmationResponse extends ThanosMessageBase {
  type: ThanosMessageType.DAppOpsConfirmationResponse;
}

export interface ThanosDAppSignConfirmationRequest extends ThanosMessageBase {
  type: ThanosMessageType.DAppSignConfirmationRequest;
  id: string;
  confirmed: boolean;
}

export interface ThanosDAppSignConfirmationResponse extends ThanosMessageBase {
  type: ThanosMessageType.DAppSignConfirmationResponse;
}
