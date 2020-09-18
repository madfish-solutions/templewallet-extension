export type Network = "carthagenet" | "dalphanet" | "mainnet" | "delphinet";
export type Period = "year" | "month" | "week" | "day";

export interface ApiError {
  message: string;
}

export interface TokenMethodStats {
  average_consumed_gas: number;
  call_count: number;
}

export interface TokenContract {
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
  type: string;
}

export interface PageableTokenContracts {
  last_id: number;
  tokens: TokenContract[];
  total: number;
}

export type TokenSeries = number[][];

export interface TokenTransfer {
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
  token_id: string;
};

export type TokenTransfersQueryParams = {
  network: Network;
  address: string;
  last_id?: string;
  size?: number;
};
