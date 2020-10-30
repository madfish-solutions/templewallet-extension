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
