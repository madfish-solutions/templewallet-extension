export type Network =
  | "carthagenet"
  | "dalphanet"
  | "mainnet"
  | "delphinet"
  | "dalphanet";
export type Period = "year" | "month" | "week" | "day";
export type ContractType = "fa1" | "fa12";

export interface ApiError {
  message: string;
}

export interface TokenMethodStats {
  average_consumed_gas: number;
  call_count: number;
}

export interface RawTokenContract {
  address: string;
  alias: string;
  balance: number;
  delegate: string;
  delegate_alias: string;
  last_action: string;
  level: number;
  manager: string;
  methods: Record<string, TokenMethodStats>;
  network: Network;
  timestamp: string;
  tx_count: number;
  type: ContractType;
}

export interface TokenContract
  extends Omit<RawTokenContract, "last_action" | "timestamp"> {
  last_action: Date;
  timestamp: Date;
}

export interface RawPageableTokenContracts {
  last_id: number;
  tokens: RawTokenContract[];
  total: number;
}

export interface PageableTokenContracts {
  last_id: number;
  tokens: TokenContract[];
  total: number;
}

export type TokenSeries = number[][];

export interface RawTokenTransfer {
  amount: number;
  contract: string;
  counter: number;
  from: string;
  hash: string;
  level: number;
  network: Network;
  nonce: number;
  protocol: string;
  source: string;
  status: string;
  timestamp: string;
  to: string;
}

export interface TokenTransfer extends Omit<RawTokenTransfer, "timestamp"> {
  timestamp: Date;
}

export interface RawPageableTokenTransfers {
  last_id?: string;
  transfers: RawTokenTransfer[];
}

export interface PageableTokenTransfers {
  last_id?: string;
  transfers: TokenTransfer[];
}

export type ContractsQueryParams = {
  network: Network;
  last_id?: string;
  size?: number;
  faversion?: string;
};

export type TokenVolumeSeriesQueryParams = {
  network: Network;
  period: Period;
  address: string;
  token_id: number;
};

export type TokenTransfersQueryParams = {
  network: Network;
  address: string;
  last_id?: string;
  size?: number;
};
