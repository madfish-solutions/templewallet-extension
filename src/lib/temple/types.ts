import { OperationContentsAndResult } from "@taquito/rpc";
import { Estimate } from "@taquito/taquito/dist/types/contract/estimate";
import {
  TempleDAppMetadata,
  TempleDAppNetwork,
} from "@temple-wallet/dapp/dist/types";

type NonEmptyArray<T> = [T, ...T[]];

export interface ReadyTempleState extends TempleState {
  status: TempleStatus.Ready;
  accounts: NonEmptyArray<TempleAccount>;
  networks: NonEmptyArray<TempleNetwork>;
  settings: TempleSettings;
}

export interface TempleDAppSession {
  network: TempleDAppNetwork;
  appMeta: TempleDAppMetadata;
  pkh: string;
  publicKey: string;
}

export interface TempleState {
  status: TempleStatus;
  accounts: TempleAccount[];
  networks: TempleNetwork[];
  settings: TempleSettings | null;
}

export enum TempleChainId {
  Mainnet = "NetXdQprcVkpaWU",
  Edo2net = "NetXSgo1ZT2DRUG",
  Florencenet = "NetXxkAx4woPLyu",
  Delphinet = "NetXm8tYqnMWky1",
  Carthagenet = "NetXjD3HPJJjmcd",
}

export function isKnownChainId(chainId: string): chainId is TempleChainId {
  return Object.values(TempleChainId).includes(chainId as TempleChainId);
}

export enum TempleStatus {
  Idle,
  Locked,
  Ready,
}

export type TempleAccount =
  | TempleHDAccount
  | TempleImportedAccount
  | TempleLedgerAccount
  | TempleManagedKTAccount
  | TempleWatchOnlyAccount;

export enum DerivationType {
  ED25519 = 0,
  SECP256K1 = 1,
  P256 = 2,
}

export interface TempleLedgerAccount extends TempleAccountBase {
  type: TempleAccountType.Ledger;
  derivationPath: string;
}

export interface TempleImportedAccount extends TempleAccountBase {
  type: TempleAccountType.Imported;
}

export interface TempleHDAccount extends TempleAccountBase {
  type: TempleAccountType.HD;
  hdIndex: number;
}

export interface TempleManagedKTAccount extends TempleAccountBase {
  type: TempleAccountType.ManagedKT;
  chainId: string;
  owner: string;
}

export interface TempleWatchOnlyAccount extends TempleAccountBase {
  type: TempleAccountType.WatchOnly;
  chainId?: string;
}

export interface TempleAccountBase {
  type: TempleAccountType;
  name: string;
  publicKeyHash: string;
  hdIndex?: number;
  derivationPath?: string;
  derivationType?: DerivationType;
}

export enum TempleAccountType {
  HD,
  Imported,
  Ledger,
  ManagedKT,
  WatchOnly,
}

export interface TempleNetwork {
  id: string;
  name: string;
  nameI18nKey?: string;
  description: string;
  descriptionI18nKey?: string;
  lambdaContract?: string;
  type: TempleNetworkType;
  rpcBaseURL: string;
  color: string;
  disabled: boolean;
  hidden?: boolean;
}

export type TempleAsset = TempleTEZAsset | TempleToken;

export type TempleToken =
  | TempleTzBTCAsset
  | TempleStakerAsset
  | TempleFA1_2Asset
  | TempleFA2Asset;

export enum TempleAssetType {
  TEZ = "TEZ",
  TzBTC = "TzBTC",
  Staker = "STAKER",
  FA1_2 = "FA1_2",
  FA2 = "FA2",
}

export interface TempleAssetBase {
  type: TempleAssetType;
  decimals: number;
  symbol: string;
  name: string;
  fungible: boolean;
  status: "displayed" | "hidden" | "removed";
}

export interface TempleTokenBase extends TempleAssetBase {
  address: string;
  iconUrl?: string;
}

export interface TempleTEZAsset extends TempleAssetBase {
  type: TempleAssetType.TEZ;
}

export interface TempleTzBTCAsset extends TempleTokenBase {
  type: TempleAssetType.TzBTC;
}

export interface TempleStakerAsset extends TempleTokenBase {
  type: TempleAssetType.Staker;
}

export interface TempleFA1_2Asset extends TempleTokenBase {
  type: TempleAssetType.FA1_2;
}

export interface TempleFA2Asset extends TempleTokenBase {
  type: TempleAssetType.FA2;
  id: number;
}

export type TempleNetworkType = "main" | "test";

export interface TempleSettings {
  customNetworks?: TempleNetwork[];
  lambdaContracts?: Record<string, string>;
}

export enum TempleSharedStorageKey {
  DAppEnabled = "dappenabled",
  LocaleCode = "localecode",
}

export type TemplePendingOperation = OperationContentsAndResult & {
  hash: string;
  addedAt: string;
};

export type TempleDAppSessions = Record<string, TempleDAppSession>;

/**
 * Internal confirmation payloads
 */
export interface TempleConfirmationPayloadBase {
  type: string;
  sourcePkh: string;
}

export interface TempleSignConfirmationPayload
  extends TempleConfirmationPayloadBase {
  type: "sign";
  bytes: string;
  watermark?: string;
}

export interface TempleOpsConfirmationPayload
  extends TempleConfirmationPayloadBase {
  type: "operations";
  networkRpc: string;
  opParams: any[];
  bytesToSign?: string;
  rawToSign?: any;
  estimates?: Estimate[];
}

export type TempleConfirmationPayload =
  | TempleSignConfirmationPayload
  | TempleOpsConfirmationPayload;

/**
 * DApp confirmation payloads
 */

export interface TempleDAppPayloadBase {
  type: string;
  origin: string;
  networkRpc: string;
  appMeta: TempleDAppMetadata;
}

export interface TempleDAppConnectPayload extends TempleDAppPayloadBase {
  type: "connect";
}

export interface TempleDAppOperationsPayload extends TempleDAppPayloadBase {
  type: "confirm_operations";
  sourcePkh: string;
  sourcePublicKey: string;
  opParams: any[];
  bytesToSign?: string;
  rawToSign?: any;
  estimates?: Estimate[];
}

export interface TempleDAppSignPayload extends TempleDAppPayloadBase {
  type: "sign";
  sourcePkh: string;
  payload: string;
  preview: any;
}

export type TempleDAppPayload =
  | TempleDAppConnectPayload
  | TempleDAppOperationsPayload
  | TempleDAppSignPayload;

/**
 * Messages
 */

export enum TempleMessageType {
  // Notifications
  StateUpdated = "TEMPLE_STATE_UPDATED",
  ConfirmationRequested = "TEMPLE_CONFIRMATION_REQUESTED",
  ConfirmationExpired = "TEMPLE_CONFIRMATION_EXPIRED",
  // Request-Response pairs
  GetStateRequest = "TEMPLE_GET_STATE_REQUEST",
  GetStateResponse = "TEMPLE_GET_STATE_RESPONSE",
  NewWalletRequest = "TEMPLE_NEW_WALLET_REQUEST",
  NewWalletResponse = "TEMPLE_NEW_WALLET_RESPONSE",
  UnlockRequest = "TEMPLE_UNLOCK_REQUEST",
  UnlockResponse = "TEMPLE_UNLOCK_RESPONSE",
  LockRequest = "TEMPLE_LOCK_REQUEST",
  LockResponse = "TEMPLE_LOCK_RESPONSE",
  CreateAccountRequest = "TEMPLE_CREATE_ACCOUNT_REQUEST",
  CreateAccountResponse = "TEMPLE_CREATE_ACCOUNT_RESPONSE",
  RevealPublicKeyRequest = "TEMPLE_REVEAL_PUBLIC_KEY_REQUEST",
  RevealPublicKeyResponse = "TEMPLE_REVEAL_PUBLIC_KEY_RESPONSE",
  RevealPrivateKeyRequest = "TEMPLE_REVEAL_PRIVATE_KEY_REQUEST",
  RevealPrivateKeyResponse = "TEMPLE_REVEAL_PRIVATE_KEY_RESPONSE",
  RevealMnemonicRequest = "TEMPLE_REVEAL_MNEMONIC_REQUEST",
  RevealMnemonicResponse = "TEMPLE_REVEAL_MNEMONIC_RESPONSE",
  RemoveAccountRequest = "TEMPLE_REMOVE_ACCOUNT_REQUEST",
  RemoveAccountResponse = "TEMPLE_REMOVE_ACCOUNT_RESPONSE",
  EditAccountRequest = "TEMPLE_EDIT_ACCOUNT_REQUEST",
  EditAccountResponse = "TEMPLE_EDIT_ACCOUNT_RESPONSE",
  ImportAccountRequest = "TEMPLE_IMPORT_ACCOUNT_REQUEST",
  ImportAccountResponse = "TEMPLE_IMPORT_ACCOUNT_RESPONSE",
  ImportMnemonicAccountRequest = "TEMPLE_IMPORT_MNEMONIC_ACCOUNT_REQUEST",
  ImportMnemonicAccountResponse = "TEMPLE_IMPORT_MNEMONIC_ACCOUNT_RESPONSE",
  ImportFundraiserAccountRequest = "TEMPLE_IMPORT_FUNDRAISER_ACCOUNT_REQUEST",
  ImportFundraiserAccountResponse = "TEMPLE_IMPORT_FUNDRAISER_ACCOUNT_RESPONSE",
  ImportManagedKTAccountRequest = "TEMPLE_IMPORT_MANAGED_KT_ACCOUNT_REQUEST",
  ImportManagedKTAccountResponse = "TEMPLE_IMPORT_MANAGED_KT_ACCOUNT_RESPONSE",
  ImportWatchOnlyAccountRequest = "TEMPLE_IMPORT_WATCH_ONLY_ACCOUNT_REQUEST",
  ImportWatchOnlyAccountResponse = "TEMPLE_IMPORT_WATCH_ONLY_ACCOUNT_RESPONSE",
  CreateLedgerAccountRequest = "TEMPLE_CREATE_LEDGER_ACCOUNT_REQUEST",
  CreateLedgerAccountResponse = "TEMPLE_CREATE_LEDGER_ACCOUNT_RESPONSE",
  UpdateSettingsRequest = "TEMPLE_UPDATE_SETTINGS_REQUEST",
  UpdateSettingsResponse = "TEMPLE_UPDATE_SETTINGS_RESPONSE",
  GetAllPndOpsRequest = "TEMPLE_GET_ALL_PND_OPS_REQUEST",
  GetAllPndOpsResponse = "TEMPLE_GET_ALL_PND_OPS_RESPONSE",
  RemovePndOpsRequest = "TEMPLE_REMOVE_PND_OPS_REQUEST",
  RemovePndOpsResponse = "TEMPLE_REMOVE_PND_OPS_RESPONSE",
  OperationsRequest = "TEMPLE_OPERATIONS_REQUEST",
  OperationsResponse = "TEMPLE_OPERATIONS_RESPONSE",
  SignRequest = "TEMPLE_SIGN_REQUEST",
  SignResponse = "TEMPLE_SIGN_RESPONSE",
  ConfirmationRequest = "TEMPLE_CONFIRMATION_REQUEST",
  ConfirmationResponse = "TEMPLE_CONFIRMATION_RESPONSE",
  PageRequest = "TEMPLE_PAGE_REQUEST",
  PageResponse = "TEMPLE_PAGE_RESPONSE",
  DAppGetPayloadRequest = "TEMPLE_DAPP_GET_PAYLOAD_REQUEST",
  DAppGetPayloadResponse = "TEMPLE_DAPP_GET_PAYLOAD_RESPONSE",
  DAppPermConfirmationRequest = "TEMPLE_DAPP_PERM_CONFIRMATION_REQUEST",
  DAppPermConfirmationResponse = "TEMPLE_DAPP_PERM_CONFIRMATION_RESPONSE",
  DAppOpsConfirmationRequest = "TEMPLE_DAPP_OPS_CONFIRMATION_REQUEST",
  DAppOpsConfirmationResponse = "TEMPLE_DAPP_OPS_CONFIRMATION_RESPONSE",
  DAppSignConfirmationRequest = "TEMPLE_DAPP_SIGN_CONFIRMATION_REQUEST",
  DAppSignConfirmationResponse = "TEMPLE_DAPP_SIGN_CONFIRMATION_RESPONSE",
  DAppGetAllSessionsRequest = "TEMPLE_DAPP_GET_ALL_SESSIONS_REQUEST",
  DAppGetAllSessionsResponse = "TEMPLE_DAPP_GET_ALL_SESSIONS_RESPONSE",
  DAppRemoveSessionRequest = "TEMPLE_DAPP_REMOVE_SESSION_REQUEST",
  DAppRemoveSessionResponse = "TEMPLE_DAPP_REMOVE_SESSION_RESPONSE",
}

export type TempleNotification =
  | TempleStateUpdated
  | TempleConfirmationRequested
  | TempleConfirmationExpired;

export type TempleRequest =
  | TempleGetStateRequest
  | TempleNewWalletRequest
  | TempleUnlockRequest
  | TempleLockRequest
  | TempleCreateAccountRequest
  | TempleRevealPublicKeyRequest
  | TempleRevealPrivateKeyRequest
  | TempleRevealMnemonicRequest
  | TempleEditAccountRequest
  | TempleImportAccountRequest
  | TempleImportMnemonicAccountRequest
  | TempleImportFundraiserAccountRequest
  | TempleImportManagedKTAccountRequest
  | TempleImportWatchOnlyAccountRequest
  | TempleCreateLedgerAccountRequest
  | TempleOperationsRequest
  | TempleSignRequest
  | TempleConfirmationRequest
  | TempleRemoveAccountRequest
  | TemplePageRequest
  | TempleDAppGetPayloadRequest
  | TempleDAppPermConfirmationRequest
  | TempleDAppOpsConfirmationRequest
  | TempleDAppSignConfirmationRequest
  | TempleUpdateSettingsRequest
  | TempleGetAllDAppSessionsRequest
  | TempleRemoveDAppSessionRequest
  | TempleGetAllPndOpsRequest
  | TempleRemovePndOpsRequest;

export type TempleResponse =
  | TempleGetStateResponse
  | TempleNewWalletResponse
  | TempleUnlockResponse
  | TempleLockResponse
  | TempleCreateAccountResponse
  | TempleRevealPublicKeyResponse
  | TempleRevealPrivateKeyResponse
  | TempleRevealMnemonicResponse
  | TempleEditAccountResponse
  | TempleImportAccountResponse
  | TempleImportMnemonicAccountResponse
  | TempleImportFundraiserAccountResponse
  | TempleImportManagedKTAccountResponse
  | TempleImportWatchOnlyAccountResponse
  | TempleCreateLedgerAccountResponse
  | TempleOperationsResponse
  | TempleSignResponse
  | TempleConfirmationResponse
  | TempleRemoveAccountResponse
  | TemplePageResponse
  | TempleDAppGetPayloadResponse
  | TempleDAppPermConfirmationResponse
  | TempleDAppOpsConfirmationResponse
  | TempleDAppSignConfirmationResponse
  | TempleUpdateSettingsResponse
  | TempleGetAllDAppSessionsResponse
  | TempleRemoveDAppSessionResponse
  | TempleGetAllPndOpsResponse
  | TempleRemovePndOpsResponse;

export interface TempleMessageBase {
  type: TempleMessageType;
}

export interface TempleStateUpdated extends TempleMessageBase {
  type: TempleMessageType.StateUpdated;
}

export interface TempleConfirmationRequested extends TempleMessageBase {
  type: TempleMessageType.ConfirmationRequested;
  id: string;
  payload: TempleConfirmationPayload;
}

export interface TempleConfirmationExpired extends TempleMessageBase {
  type: TempleMessageType.ConfirmationExpired;
  id: string;
}

export interface TempleGetStateRequest extends TempleMessageBase {
  type: TempleMessageType.GetStateRequest;
}

export interface TempleGetStateResponse extends TempleMessageBase {
  type: TempleMessageType.GetStateResponse;
  state: TempleState;
}

export interface TempleNewWalletRequest extends TempleMessageBase {
  type: TempleMessageType.NewWalletRequest;
  password: string;
  mnemonic?: string;
}

export interface TempleNewWalletResponse extends TempleMessageBase {
  type: TempleMessageType.NewWalletResponse;
}

export interface TempleUnlockRequest extends TempleMessageBase {
  type: TempleMessageType.UnlockRequest;
  password: string;
}

export interface TempleUnlockResponse extends TempleMessageBase {
  type: TempleMessageType.UnlockResponse;
}

export interface TempleLockRequest extends TempleMessageBase {
  type: TempleMessageType.LockRequest;
}

export interface TempleLockResponse extends TempleMessageBase {
  type: TempleMessageType.LockResponse;
}

export interface TempleCreateAccountRequest extends TempleMessageBase {
  type: TempleMessageType.CreateAccountRequest;
  name?: string;
}

export interface TempleCreateAccountResponse extends TempleMessageBase {
  type: TempleMessageType.CreateAccountResponse;
}

export interface TempleRevealPublicKeyRequest extends TempleMessageBase {
  type: TempleMessageType.RevealPublicKeyRequest;
  accountPublicKeyHash: string;
}

export interface TempleRevealPublicKeyResponse extends TempleMessageBase {
  type: TempleMessageType.RevealPublicKeyResponse;
  publicKey: string;
}

export interface TempleRevealPrivateKeyRequest extends TempleMessageBase {
  type: TempleMessageType.RevealPrivateKeyRequest;
  accountPublicKeyHash: string;
  password: string;
}

export interface TempleRevealPrivateKeyResponse extends TempleMessageBase {
  type: TempleMessageType.RevealPrivateKeyResponse;
  privateKey: string;
}

export interface TempleRevealMnemonicRequest extends TempleMessageBase {
  type: TempleMessageType.RevealMnemonicRequest;
  password: string;
}

export interface TempleRevealMnemonicResponse extends TempleMessageBase {
  type: TempleMessageType.RevealMnemonicResponse;
  mnemonic: string;
}

export interface TempleRemoveAccountRequest extends TempleMessageBase {
  type: TempleMessageType.RemoveAccountRequest;
  accountPublicKeyHash: string;
  password: string;
}

export interface TempleRemoveAccountResponse extends TempleMessageBase {
  type: TempleMessageType.RemoveAccountResponse;
}

export interface TempleEditAccountRequest extends TempleMessageBase {
  type: TempleMessageType.EditAccountRequest;
  accountPublicKeyHash: string;
  name: string;
}

export interface TempleEditAccountResponse extends TempleMessageBase {
  type: TempleMessageType.EditAccountResponse;
}

export interface TempleImportAccountRequest extends TempleMessageBase {
  type: TempleMessageType.ImportAccountRequest;
  privateKey: string;
  encPassword?: string;
}

export interface TempleImportAccountResponse extends TempleMessageBase {
  type: TempleMessageType.ImportAccountResponse;
}

export interface TempleImportMnemonicAccountRequest extends TempleMessageBase {
  type: TempleMessageType.ImportMnemonicAccountRequest;
  mnemonic: string;
  password?: string;
  derivationPath?: string;
}

export interface TempleImportMnemonicAccountResponse extends TempleMessageBase {
  type: TempleMessageType.ImportMnemonicAccountResponse;
}

export interface TempleImportFundraiserAccountRequest
  extends TempleMessageBase {
  type: TempleMessageType.ImportFundraiserAccountRequest;
  email: string;
  password: string;
  mnemonic: string;
}

export interface TempleImportFundraiserAccountResponse
  extends TempleMessageBase {
  type: TempleMessageType.ImportFundraiserAccountResponse;
}

export interface TempleImportManagedKTAccountRequest extends TempleMessageBase {
  type: TempleMessageType.ImportManagedKTAccountRequest;
  address: string;
  chainId: string;
  owner: string;
}

export interface TempleImportManagedKTAccountResponse
  extends TempleMessageBase {
  type: TempleMessageType.ImportManagedKTAccountResponse;
}

export interface TempleImportWatchOnlyAccountRequest extends TempleMessageBase {
  type: TempleMessageType.ImportWatchOnlyAccountRequest;
  address: string;
  chainId?: string;
}

export interface TempleImportWatchOnlyAccountResponse
  extends TempleMessageBase {
  type: TempleMessageType.ImportWatchOnlyAccountResponse;
}

export interface TempleCreateLedgerAccountRequest extends TempleMessageBase {
  type: TempleMessageType.CreateLedgerAccountRequest;
  name: string;
  derivationPath?: string;
  derivationType?: DerivationType;
}

export interface TempleCreateLedgerAccountResponse extends TempleMessageBase {
  type: TempleMessageType.CreateLedgerAccountResponse;
}

export interface TempleUpdateSettingsRequest extends TempleMessageBase {
  type: TempleMessageType.UpdateSettingsRequest;
  settings: Partial<TempleSettings>;
}

export interface TempleUpdateSettingsResponse extends TempleMessageBase {
  type: TempleMessageType.UpdateSettingsResponse;
}

export interface TempleGetAllPndOpsRequest extends TempleMessageBase {
  type: TempleMessageType.GetAllPndOpsRequest;
  accountPublicKeyHash: string;
  netId: string;
}

export interface TempleGetAllPndOpsResponse extends TempleMessageBase {
  type: TempleMessageType.GetAllPndOpsResponse;
  operations: TemplePendingOperation[];
}

export interface TempleRemovePndOpsRequest extends TempleMessageBase {
  type: TempleMessageType.RemovePndOpsRequest;
  accountPublicKeyHash: string;
  netId: string;
  opHashes: string[];
}

export interface TempleRemovePndOpsResponse extends TempleMessageBase {
  type: TempleMessageType.RemovePndOpsResponse;
}

export interface TempleOperationsRequest extends TempleMessageBase {
  type: TempleMessageType.OperationsRequest;
  id: string;
  sourcePkh: string;
  networkRpc: string;
  opParams: any[];
}

export interface TempleOperationsResponse extends TempleMessageBase {
  type: TempleMessageType.OperationsResponse;
  opHash: string;
}

export interface TempleSignRequest extends TempleMessageBase {
  type: TempleMessageType.SignRequest;
  id: string;
  sourcePkh: string;
  bytes: string;
  watermark?: string;
}

export interface TempleSignResponse extends TempleMessageBase {
  type: TempleMessageType.SignResponse;
  result: any;
}

export interface TempleConfirmationRequest extends TempleMessageBase {
  type: TempleMessageType.ConfirmationRequest;
  id: string;
  confirmed: boolean;
  modifiedStorageLimit?: number;
}

export interface TempleConfirmationResponse extends TempleMessageBase {
  type: TempleMessageType.ConfirmationResponse;
}

export interface TemplePageRequest extends TempleMessageBase {
  type: TempleMessageType.PageRequest;
  origin: string;
  payload: any;
  beacon?: boolean;
  encrypted?: boolean;
}

export interface TemplePageResponse extends TempleMessageBase {
  type: TempleMessageType.PageResponse;
  payload: any;
  encrypted?: boolean;
}

export interface TempleDAppGetPayloadRequest extends TempleMessageBase {
  type: TempleMessageType.DAppGetPayloadRequest;
  id: string;
}

export interface TempleDAppGetPayloadResponse extends TempleMessageBase {
  type: TempleMessageType.DAppGetPayloadResponse;
  payload: TempleDAppPayload;
}

export interface TempleDAppPermConfirmationRequest extends TempleMessageBase {
  type: TempleMessageType.DAppPermConfirmationRequest;
  id: string;
  confirmed: boolean;
  accountPublicKey: string;
  accountPublicKeyHash: string;
}

export interface TempleDAppPermConfirmationResponse extends TempleMessageBase {
  type: TempleMessageType.DAppPermConfirmationResponse;
}

export interface TempleDAppOpsConfirmationRequest extends TempleMessageBase {
  type: TempleMessageType.DAppOpsConfirmationRequest;
  id: string;
  confirmed: boolean;
  modifiedStorageLimit?: number;
}

export interface TempleDAppOpsConfirmationResponse extends TempleMessageBase {
  type: TempleMessageType.DAppOpsConfirmationResponse;
}

export interface TempleDAppSignConfirmationRequest extends TempleMessageBase {
  type: TempleMessageType.DAppSignConfirmationRequest;
  id: string;
  confirmed: boolean;
}

export interface TempleDAppSignConfirmationResponse extends TempleMessageBase {
  type: TempleMessageType.DAppSignConfirmationResponse;
}

export interface TempleGetAllDAppSessionsRequest extends TempleMessageBase {
  type: TempleMessageType.DAppGetAllSessionsRequest;
}

export interface TempleGetAllDAppSessionsResponse extends TempleMessageBase {
  type: TempleMessageType.DAppGetAllSessionsResponse;
  sessions: TempleDAppSessions;
}

export interface TempleRemoveDAppSessionRequest extends TempleMessageBase {
  type: TempleMessageType.DAppRemoveSessionRequest;
  origin: string;
}

export interface TempleRemoveDAppSessionResponse extends TempleMessageBase {
  type: TempleMessageType.DAppRemoveSessionResponse;
  sessions: TempleDAppSessions;
}

export type OperationsPreview = any[] | { branch: string; contents: any[] };

export enum ImportAccountFormType {
  PrivateKey = "ImportAccountFormType.PrivateKey",
  Mnemonic = "ImportAccountFormType.Mnemonic",
  Fundraiser = "ImportAccountFormType.Fundraiser",
  FaucetFile = "ImportAccountFormType.FaucetFile",
  ManagedKT = "ImportAccountFormType.ManagedKT",
  WatchOnly = "ImportAccountFormType.WatchOnly",
}
