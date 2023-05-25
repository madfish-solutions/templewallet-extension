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

type Int32ParameterKey = typeof allInt32ParameterKeys[number];

type Int32Parameter = Partial<Record<Int32ParameterKey, number>>;

export type TzktGetRewardsParams = {
  address: string;
  cycle?: Int32Parameter;
  sort?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
  quote?: TzktQuoteCurrency[];
};

export type TzktRewardsEntry = {
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
};

export type TzktGetRewardsResponse = TzktRewardsEntry[] | undefined;

export interface TzktAccountToken {
  account: TzktAlias;
  balance: string;
  firstLevel: number;
  firstTime: string;
  id: number;
  lastLevel: number;
  lastTime: string;
  token: {
    contract: TzktAlias;
    id: number;
    metadata: {
      artifactUri: string;
      creators: Array<string>;
      decimals?: string;
      description: string;
      displayUri: string;
      formats: Array<{ uri: string; mimeType: string }>;
      isBooleanAmount: boolean;
      name: string;
      shouldPreferSymbol: boolean;
      symbol: string;
      tags: Array<string>;
      thumbnailUri: string;
    };
    standard: string;
    tokenId: string;
  };
  transfersCount: number;
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

export interface TzktTokenMetadata {
  decimals?: string;
  description: string;
  name: string;
  symbol: string;
  shouldPreferSymbol: boolean;
  thumbnailUri: string;
  displayUri: string;
  artifactUri?: string;
}
