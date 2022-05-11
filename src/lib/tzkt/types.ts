// Actually, there is a bunch of other types but only these will be used for now
export type TzktOperationType = 'delegation' | 'transaction' | 'reveal' | 'origination';

export type TzktQuoteCurrency = 'None' | 'Btc' | 'Eur' | 'Usd' | 'Cny' | 'Jpy' | 'Krw';

export type TzktOperationStatus = 'applied' | 'failed' | 'backtracked' | 'skipped';

export type TzktContractType = 'delegator_contract' | 'smart_contract';

export interface TzktAlias {
  alias?: string;
  address: string;
}

export interface TzktOperationError {
  type: string;
}

// To be reviewed if a new operation type is added
interface TzktOperationBase {
  type: TzktOperationType;
  id: number;
  level?: number;
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

export type TzktGetOperationsParams = {
  address: string;
  from?: string;
  to?: string;
  type?: TzktOperationType[];
  lastId?: number;
  limit?: number;
  offset?: number;
  sort?: 0 | 1;
  quote?: TzktQuoteCurrency[];
};

export type TzktQuote = Partial<Record<TzktQuoteCurrency, number>>;

export interface TzktDelegationOperation extends TzktOperationBase {
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
  parameters?: string;
  hasInternals: boolean;
}

export interface TzktRevealOperation extends TzktOperationBase {
  type: 'reveal';
}

export type TzktOperation = TzktDelegationOperation | TzktTransactionOperation | TzktRevealOperation;

export type TzktDelegateInfo = {
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

type Int32ParameterKey = 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 'in' | 'ni';
export type Int32Parameter = Partial<Record<Int32ParameterKey, number>>;

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

export const allInt32ParameterKeys: Int32ParameterKey[] = ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'in', 'ni'];

export const isReveal = (operation: TzktOperation): operation is TzktRevealOperation => {
  return operation.type === 'reveal';
};

export interface TzktAccountTokenBalance {
  account: { address: string };
  balance: string;
  firstLevel: number;
  firstTime: string;
  id: number;
  lastLevel: number;
  lastTime: string;
  token: {
    contract: { alias: string; address: string };
    id: number;
    metadata: {
      artifactUri: string;
      creators: Array<string>;
      decimals: string;
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

export interface TzktAccountOperations {
  amount: string;
  from: {
    address: string;
    alias?: string;
  };
  id: number;
  level: number;
  timestamp: string;
  to: {
    address: string;
    alias?: string;
  };
  token: {
    contract: {
      alias: string;
      address: string;
    };
    id: number;
    metadata: {
      decimals: string;
      eth_contract: string;
      eth_name: string;
      eth_symbol: string;
      name: string;
      symbol: string;
      thumbnailUri: string;
    };
    standard: string;
    tokenId: string;
  };
  transactionId: number;
}

export interface TzktTokenTransfer {
  allocationFee: number;
  amount: number;
  bakerFee: number;
  block: string;
  counter: number;
  gasLimit: number;
  gasUsed: number;
  hasInternals: boolean;
  hash: string;
  id: number;
  level: number;
  parameter: {};
  sender: {
    address: string;
    alias?: string;
  };
  status: string;
  storageFee: number;
  storageLimit: number;
  storageUsed: number;
  target: {
    address: string;
    alias?: string;
  };
  timestamp: string;
  type: string;
}
