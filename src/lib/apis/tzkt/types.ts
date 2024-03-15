import { HubConnection } from '@microsoft/signalr';

/**
 * Actually, there is a bunch of other types but only these will be used for now
 */
export type TzktOperationType = 'delegation' | 'transaction' | 'reveal' | 'origination';

export type TzktQuoteCurrency = 'None' | 'Btc' | 'Eur' | 'Usd' | 'Cny' | 'Jpy' | 'Krw';

type TzktOperationStatus = 'applied' | 'failed' | 'backtracked' | 'skipped';

type TzktContractType = 'delegator_contract' | 'smart_contract';

export interface TzktAlias {
  alias?: string;
  address: string;
}

interface TzktOperationError {
  type: string;
}

/**
 * To be reviewed if a new operation type is added
 */
interface TzktOperationBase {
  type: TzktOperationType;
  id: number;
  level?: number;
  /** ISO Date */
  timestamp: string;
  block?: string;
  hash: string;
  counter: number;
  sender: TzktAlias;
  gasLimit: number;
  gasUsed: number;
  bakerFee: number;
  quote?: TzktQuote;
  errors?: TzktOperationError[] | null;
  status: TzktOperationStatus;
}

type TzktQuote = Partial<Record<TzktQuoteCurrency, number>>;

interface TzktDelegationOperation extends TzktOperationBase {
  type: 'delegation';
  initiator?: TzktAlias;
  nonce?: number;
  amount?: number;
  prevDelegate?: TzktAlias | null;
  newDelegate?: TzktAlias | null;
}

export interface TzktTransactionOperation extends TzktOperationBase {
  type: 'transaction';
  initiator?: TzktAlias;
  nonce?: number;
  storageLimit: number;
  storageUsed: number;
  storageFee: number;
  allocationFee: number;
  target: TzktAlias;
  amount: number;
  parameter?: unknown;
  entrypoint?: string;
  hasInternals: boolean;
}

interface TzktOriginationOperation extends TzktOperationBase {
  type: 'origination';
  originatedContract?: TzktAlias;
  contractBalance?: string;
}

interface TzktRevealOperation extends TzktOperationBase {
  type: 'reveal';
}

export type TzktOperation =
  | TzktDelegationOperation
  | TzktTransactionOperation
  | TzktRevealOperation
  | TzktOriginationOperation;

type TzktDelegateInfo = {
  alias?: string;
  address: string;
  active: boolean;
};

export type TzktRelatedContract = {
  kind: TzktContractType;
  alias?: string;
  address: string;
  balance: number;
  delegate?: TzktDelegateInfo;
  creationLevel: number;
  creationTime: string;
};

export const allInt32ParameterKeys = ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'in', 'ni'] as const;

type Int32ParameterKey = (typeof allInt32ParameterKeys)[number];

type Int32Parameter = Partial<Record<Int32ParameterKey, number>>;

export type TzktGetRewardsParams = {
  address: string;
  cycle?: Int32Parameter;
  sort?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
  quote?: TzktQuoteCurrency[];
};

export interface TzktRewardsEntry {
  cycle: number;
  balance: number;
  baker: {
    alias?: string;
    address: string;
  };
  stakingBalance: number;
  expectedBlocks: number;
  expectedEndorsements: number;
  futureBlocks: number;
  futureBlockRewards: number;
  ownBlocks: number;
  ownBlockRewards: number;
  extraBlocks: number;
  extraBlockRewards: number;
  missedOwnBlocks: number;
  missedOwnBlockRewards: number;
  missedExtraBlocks: number;
  missedExtraBlockRewards: number;
  uncoveredOwnBlocks: number;
  uncoveredOwnBlockRewards: number;
  uncoveredExtraBlocks: number;
  uncoveredExtraBlockRewards: number;
  futureEndorsements: number;
  futureEndorsementRewards: number;
  endorsements: number;
  endorsementRewards: number;
  missedEndorsements: number;
  missedEndorsementRewards: number;
  uncoveredEndorsements: number;
  uncoveredEndorsementRewards: number;
  ownBlockFees: number;
  extraBlockFees: number;
  missedOwnBlockFees: number;
  missedExtraBlockFees: number;
  uncoveredOwnBlockFees: number;
  uncoveredExtraBlockFees: number;
  doubleBakingRewards: number;
  doubleBakingLostDeposits: number;
  doubleBakingLostRewards: number;
  doubleBakingLostFees: number;
  doubleEndorsingRewards: number;
  doubleEndorsingLostDeposits: number;
  doubleEndorsingLostRewards: number;
  doubleEndorsingLostFees: number;
  revelationRewards: number;
  revelationLostRewards: number;
  revelationLostFees: number;
  quote?: TzktQuote;
}

export type TzktGetRewardsResponse = TzktRewardsEntry[] | undefined;

export interface TzktAccountAsset {
  id: number;
  account: TzktAlias;
  /** Raw value, not divided by `decimals` */
  balance: string;
  firstLevel: number;
  firstTime: string;
  lastLevel: number;
  lastTime: string;
  transfersCount: number;
  token: TzktAssetToken;
}

interface TzktAssetToken {
  id: number;
  contract: TzktAlias;
  standard: 'fa1.2' | 'fa2';
  tokenId: string;
  /**
   * @deprecated // Not always correct information
   */
  metadata?: TzktAssetMetadata;
}

interface TzktAssetMetadata {
  creators: string[];
  decimals?: string;
  description: string;
  formats: { uri: string; mimeType: string }[];
  isBooleanAmount: boolean;
  name: string;
  shouldPreferSymbol: boolean;
  symbol: string;
  tags: string[];
  thumbnailUri: string;
  displayUri: string;
  artifactUri: string;
}

export interface TzktTokenTransfer {
  amount: string;
  from: TzktAlias;
  id: number;
  level: number;
  timestamp: string;
  to: TzktAlias;
  token: {
    contract: TzktAlias;
    id: number;
    metadata: {
      name: string;
      symbol: string;
      decimals: string;
      thumbnailUri?: string;
      eth_name?: string;
      eth_symbol?: string;
      eth_contract?: string;
    };
    standard: string;
    tokenId: string;
  };
  transactionId: number;
}

export enum TzktAccountType {
  User = 'user',
  Delegate = 'delegate',
  Contract = 'contract',
  Ghost = 'ghost',
  Rollup = 'rollup',
  SmartRollup = 'smart_rollup',
  Empty = 'empty'
}

interface TzktAccountBase {
  type: TzktAccountType;
  address: string;
  alias: string | nullish;
  balance?: number;
  stakedBalance?: number;
  unstakedBalance?: number;
}

interface TzktUserAccount extends TzktAccountBase {
  type: TzktAccountType.User;
  id: number;
  publicKey: string;
  revealed: boolean;
  balance: number;
  rollupBonds: number;
  smartRollupBonds: number;
  counter: number;
  delegate: TzktAlias | nullish;
  delegationLevel: number;
  delegationTime: string | nullish;
  numContracts: number;
  rollupsCount: number;
  smartRollupsCount: number;
  activeTokensCount: number;
  tokenBalancesCount: number;
  tokenTransfersCount: number;
  numActivations: number;
  numDelegations: number;
  numOriginations: number;
  numTransactions: number;
  numReveals: number;
  numRegisterConstants: number;
  numSetDepositsLimits: number;
  numMigrations: number;
  txRollupOriginationCount: number;
  txRollupSubmitBatchCount: number;
  txRollupCommitCount: number;
  txRollupReturnBondCount: number;
  txRollupFinalizeCommitmentCount: number;
  txRollupRemoveCommitmentCount: number;
  txRollupRejectionCount: number;
  txRollupDispatchTicketsCount: number;
  transferTicketCount: number;
  increasePaidStorageCount: number;
  drainDelegateCount: number;
  smartRollupAddMessagesCount: number;
  smartRollupCementCount: number;
  smartRollupExecuteCount: number;
  smartRollupOriginateCount: number;
  smartRollupPublishCount: number;
  smartRollupRecoverBondCount: number;
  smartRollupRefuteCount: number;
  refutationGamesCount: number;
  activeRefutationGamesCount: number;
  firstActivity: number | nullish;
  firstActivityTime: string | nullish;
  lastActivity: number | nullish;
  lastActivityTime: string | nullish;
}

interface TzktDelegateAccount extends TzktAccountBase {
  type: TzktAccountType.Delegate;
  id: number;
  active: boolean;
  publicKey: string | nullish;
  revealed: boolean;
  balance: number;
  rollupBonds: number;
  smartRollupBonds: number;
  frozenDepositLimit: number | nullish;
  counter: number;
  activationLevel: number;
  activationTime: string;
  deactivationLevel: number | nullish;
  deactivationTime: string | nullish;
  delegatedBalance: number;
  numContracts: number;
  rollupsCount: number;
  smartRollupsCount: number;
  activeTokensCount: number;
  tokenBalancesCount: number;
  tokenTransfersCount: number;
  numDelegators: number;
  numBlocks: number;
  numEndorsements: number;
  numPreendorsements: number;
  numBallots: number;
  numProposals: number;
  numActivations: number;
  numDoubleBaking: number;
  numDoubleEndorsing: number;
  numDoublePreendorsing: number;
  numNonceRevelations: number;
  vdfRevelationsCount: number;
  numRevelationPenalties: number;
  numEndorsingRewards: number;
  numDelegations: number;
  numOriginations: number;
  numTransactions: number;
  numReveals: number;
  numRegisterConstants: number;
  numSetDepositsLimits: number;
  numMigrations: number;
  txRollupOriginationCount: number;
  txRollupSubmitBatchCount: number;
  txRollupCommitCount: number;
  txRollupReturnBondCount: number;
  txRollupFinalizeCommitmentCount: number;
  txRollupRemoveCommitmentCount: number;
  txRollupRejectionCount: number;
  txRollupDispatchTicketsCount: number;
  transferTicketCount: number;
  increasePaidStorageCount: number;
  updateConsensusKeyCount: number;
  drainDelegateCount: number;
  smartRollupAddMessagesCount: number;
  smartRollupCementCount: number;
  smartRollupExecuteCount: number;
  smartRollupOriginateCount: number;
  smartRollupPublishCount: number;
  smartRollupRecoverBondCount: number;
  smartRollupRefuteCount: number;
  refutationGamesCount: number;
  activeRefutationGamesCount: number;
  firstActivity: number;
  firstActivityTime: string | nullish;
  lastActivity: number;
  lastActivityTime: string | nullish;
  extras: unknown;
  software: { date: string; version: string | nullish };
}

interface TzktContractAccount extends TzktAccountBase {
  type: TzktAccountType.Contract;
  id: number;
  kind: 'delegator_contract' | 'smart_contract' | nullish;
  tzips: string[] | nullish;
  balance: number;
  creator: TzktAlias | nullish;
  manager: TzktAlias | nullish;
  delegate: TzktAlias | nullish;
  delegationLevel: number | nullish;
  delegationTime: string | nullish;
  numContracts: number;
  activeTokensCount: number;
  tokensCount: number;
  tokenBalancesCount: number;
  tokenTransfersCount: number;
  numDelegations: number;
  numOriginations: number;
  numTransactions: number;
  numReveals: number;
  numMigrations: number;
  transferTicketCount: number;
  increasePaidStorageCount: number;
  eventsCount: number;
  firstActivity: number;
  firstActivityTime: string;
  lastActivity: number;
  lastActivityTime: string;
  typeHash: number;
  codeHash: number;
  /** TZIP-16 metadata (with ?legacy=true this field will contain tzkt profile info). */
  metadata: unknown;
  extras: unknown;
  /** Contract storage value. Omitted by default. Use ?includeStorage=true to include it into response. */
  storage: unknown;
}

interface TzktGhostAccount extends TzktAccountBase {
  type: TzktAccountType.Ghost;
  id: number;
  activeTokensCount: number;
  tokenBalancesCount: number;
  tokenTransfersCount: number;
  firstActivity: number;
  firstActivityTime: string;
  lastActivity: number;
  lastActivityTime: string;
  extras: unknown;
}

interface TzktRollupAccount extends TzktAccountBase {
  type: TzktAccountType.Rollup;
  id: number;
  creator: TzktAlias | nullish;
  rollupBonds: number;
  activeTokensCount: number;
  tokenBalancesCount: number;
  tokenTransfersCount: number;
  numTransactions: number;
  txRollupOriginationCount: number;
  txRollupSubmitBatchCount: number;
  txRollupCommitCount: number;
  txRollupReturnBondCount: number;
  txRollupFinalizeCommitmentCount: number;
  txRollupRemoveCommitmentCount: number;
  txRollupRejectionCount: number;
  txRollupDispatchTicketsCount: number;
  transferTicketCount: number;
  firstActivity: number;
  firstActivityTime: string;
  lastActivity: number;
  lastActivityTime: string;
  extras: unknown;
}

interface TzktSmartRollupAccount extends TzktAccountBase {
  type: TzktAccountType.SmartRollup;
  id: number;
  creator: TzktAlias | nullish;
  pvmKind: 'arith' | 'wasm' | nullish;
  genesisCommitment: string | nullish;
  lastCommitment: string | nullish;
  inboxLevel: number;
  totalStakers: number;
  activeStakers: number;
  executedCommitments: number;
  cementedCommitments: number;
  pendingCommitments: number;
  refutedCommitments: number;
  orphanCommitments: number;
  smartRollupBonds: number;
  activeTokensCount: number;
  tokenBalancesCount: number;
  tokenTransfersCount: number;
  numTransactions: number;
  transferTicketCount: number;
  smartRollupCementCount: number;
  smartRollupExecuteCount: number;
  smartRollupOriginateCount: number;
  smartRollupPublishCount: number;
  smartRollupRecoverBondCount: number;
  smartRollupRefuteCount: number;
  refutationGamesCount: number;
  activeRefutationGamesCount: number;
  firstActivity: number;
  firstActivityTime: string;
  lastActivity: number;
  lastActivityTime: string;
  extras: unknown;
}

interface TzktEmptyAccount extends TzktAccountBase {
  type: TzktAccountType.Empty;
  alias: undefined;
  counter: number;
}

export type TzktAccount =
  | TzktUserAccount
  | TzktDelegateAccount
  | TzktContractAccount
  | TzktGhostAccount
  | TzktRollupAccount
  | TzktSmartRollupAccount
  | TzktEmptyAccount;

export enum TzktSubscriptionStateMessageType {
  Subscribed = 0,
  Data = 1,
  Reorg = 2
}

/** This enum is incomplete */
export enum TzktSubscriptionMethod {
  SubscribeToAccounts = 'SubscribeToAccounts',
  SubscribeToTokenBalances = 'SubscribeToTokenBalances',
  SubscribeToOperations = 'SubscribeToOperations'
}

export enum TzktSubscriptionChannel {
  Accounts = 'accounts',
  TokenBalances = 'token_balances',
  Operations = 'operations'
}

interface SubscribeToAccountsParams {
  addresses: string[];
}

interface SubscribeToTokenBalancesParams {
  account?: string;
  contract?: string;
  tokenId?: string;
}

interface SubscribeToOperationsParams {
  /** address you want to subscribe to, or null if you want to subscribe for all operations */
  address: string | null;
  /** hash of the code of the contract to which the operation is related (can be used with 'transaction',
   * 'origination', 'delegation' types only)
   */
  codeHash?: number;
  types: string;
}

interface TzktSubscriptionMessageCommon {
  type: TzktSubscriptionStateMessageType;
  state: number;
}

interface TzktSubscribedMessage extends TzktSubscriptionMessageCommon {
  type: TzktSubscriptionStateMessageType.Subscribed;
  state: number;
}

interface TzktDataMessage<T> extends TzktSubscriptionMessageCommon {
  type: TzktSubscriptionStateMessageType.Data;
  state: number;
  data: T;
}

interface TzktReorgMessage extends TzktSubscriptionMessageCommon {
  type: TzktSubscriptionStateMessageType.Reorg;
  state: number;
}

type TzktSubscriptionMessage<T> = TzktSubscribedMessage | TzktDataMessage<T> | TzktReorgMessage;

export type TzktAccountsSubscriptionMessage = TzktSubscriptionMessage<TzktAccount[]>;

export type TzktTokenBalancesSubscriptionMessage = TzktSubscriptionMessage<TzktAccountAsset[]>;

type TzktOperationsSubscriptionMessage = TzktSubscriptionMessage<TzktOperation[]>;

export interface TzktHubConnection extends HubConnection {
  invoke(method: TzktSubscriptionMethod.SubscribeToAccounts, params: SubscribeToAccountsParams): Promise<void>;
  invoke(
    method: TzktSubscriptionMethod.SubscribeToTokenBalances,
    params: SubscribeToTokenBalancesParams
  ): Promise<void>;
  invoke(method: TzktSubscriptionMethod.SubscribeToOperations, params: SubscribeToOperationsParams): Promise<void>;

  on(method: TzktSubscriptionChannel.Accounts, cb: (msg: TzktAccountsSubscriptionMessage) => void): void;
  on(method: TzktSubscriptionChannel.TokenBalances, cb: (msg: TzktTokenBalancesSubscriptionMessage) => void): void;
  on(method: TzktSubscriptionChannel.Operations, cb: (msg: TzktOperationsSubscriptionMessage) => void): void;

  off(method: TzktSubscriptionChannel.Accounts): void;
  off(method: TzktSubscriptionChannel.Accounts, cb: (msg: TzktAccountsSubscriptionMessage) => void): void;
  off(method: TzktSubscriptionChannel.TokenBalances): void;
  off(method: TzktSubscriptionChannel.TokenBalances, cb: (msg: TzktTokenBalancesSubscriptionMessage) => void): void;
  off(method: TzktSubscriptionChannel.Operations): void;
  off(method: TzktSubscriptionChannel.Operations, cb: (msg: TzktOperationsSubscriptionMessage) => void): void;
}
