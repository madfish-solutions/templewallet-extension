// Actually, there is a bunch of other types but only these will be used for now
export type TzktOperationType = "delegation" | "transaction" | "reveal";

export type TzktNetwork =
  | "mainnet"
  | "babylonnet"
  | "carthagenet"
  | "zeronet"
  | "delphinet";

export type TzktQuoteCurrency =
  | "None"
  | "Btc"
  | "Eur"
  | "Usd"
  | "Cny"
  | "Jpy"
  | "Krw";

export type TzktOperationStatus =
  | "applied"
  | "failed"
  | "backtracked"
  | "skipped";

export type TzktContractType = "delegator_contract" | "smart_contract";

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
  timestamp?: string;
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
  sort?: 0 | 1;
  quote?: TzktQuoteCurrency[];
};

export type TzktQuote = Partial<Record<TzktQuoteCurrency, number>>;

export interface TzktDelegationOperation extends TzktOperationBase {
  type: "delegation";
  initiator?: TzktAlias;
  nonce?: number;
  amount?: number;
  prevDelegate?: TzktAlias | null;
  newDelegate?: TzktAlias | null;
}

export interface TzktTransactionOperation extends TzktOperationBase {
  type: "transaction";
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
  type: "reveal";
}

export type TzktOperation =
  | TzktDelegationOperation
  | TzktTransactionOperation
  | TzktRevealOperation;

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

type Int32ParameterKey = "eq" | "ne" | "gt" | "ge" | "lt" | "le" | "in" | "ni";
export type Int32Parameter = Partial<Record<Int32ParameterKey, number>>;

export type TzktGetRewardsParams = {
  address: string;
  cycle?: Int32Parameter;
  sort?: "asc" | "desc";
  offset?: number;
  limit?: number;
  quote?: TzktQuoteCurrency[];
};

export type TzktGetRewardsResponse = Array<{
  cycle: number;
  balance: number;
  baker: {
    alias?: string;
    address: string
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
}>;

export const allInt32ParameterKeys: Int32ParameterKey[] = [
  "eq",
  "ne",
  "gt",
  "ge",
  "lt",
  "le",
  "in",
  "ni"
]

export const isDelegation = (
  operation: TzktOperation
): operation is TzktDelegationOperation => {
  return operation.type === "delegation";
};

export const isTransaction = (
  operation: TzktOperation
): operation is TzktTransactionOperation => {
  return operation.type === "transaction";
};

export const isReveal = (
  operation: TzktOperation
): operation is TzktRevealOperation => {
  return operation.type === "reveal";
};

const validTzktNetworks = [
  "mainnet",
  "babylonnet",
  "carthagenet",
  "zeronet",
  "delphinet",
];
export const isValidTzktNetwork = (
  networkId: string
): networkId is TzktNetwork => {
  return validTzktNetworks.includes(networkId);
};
