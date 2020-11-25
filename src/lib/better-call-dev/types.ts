export type BcdRequestParams<T> = T & {
  headers?: { [key: string]: string };
  timeout?: number;
};

export type BcdNetwork = "mainnet" | "carthagenet" | "delphinet";
export type BcdContractType = "fa1" | "fa12" | "fa2";

export interface BcdApiError {
  message: string;
}

export interface BcdAccountInfo {
  address: string;
  alias: string;
  balance: number;
  last_action: string;
  network: string;
  tokens: {
    balance: number;
    contract: string;
    decimals: number;
    name: string;
    symbol: string;
    token_id: number;
  }[];
  tx_count: number;
}

export interface BcdTokenMethodStats {
  average_consumed_gas: number;
  call_count: number;
}

export interface BcdTokenContract {
  address: string;
  alias: string;
  balance: number;
  delegate: string;
  delegate_alias: string;
  last_action: string;
  level: number;
  manager: string;
  methods: Record<string, BcdTokenMethodStats>;
  network: BcdNetwork;
  timestamp: string;
  tx_count: number;
  type: BcdContractType;
}

export interface BcdPageableTokenContracts {
  last_id: number;
  tokens: BcdTokenContract[];
  total: number;
}

export interface BcdTokenTransfer {
  amount: number;
  contract: string;
  counter: number;
  from: string;
  hash: string;
  level: number;
  network: BcdNetwork;
  nonce: number;
  protocol: string;
  source: string;
  status: string;
  timestamp: string;
  to: string;
  token_id?: number;
}

export interface BcdBalanceUpdate {
  kind: string;
  change: number;
  [key: string]: any;
}

export interface BcdOperationsSearchItem {
  type: "operation";
  value: string;
  body: {
    indexed_time: number;
    hash: string;
    status: string;
    timestamp: string;
    kind: string;
    source: string;
    fee: number;
    gas_limit: number;
    storage_limit: number;
    amount?: number;
    destination: string;
    parameters: string;
    entrypoint?: string;
    parameter_strings: string[];
    storage_strings: string[];
    tags?: string[];
  };
}

export interface BcdOperationsSearchResponse {
  count: number;
  items: BcdOperationsSearchItem[];
}

export interface BcdPageableTokenTransfers {
  last_id?: string;
  transfers: BcdTokenTransfer[];
}

export type BcdAccountQueryParams = {
  network: BcdNetwork;
  address: string;
};

export type BcdContractsQueryParams = {
  network: BcdNetwork;
  last_id?: string;
  size?: number;
  faversion?: string;
};

export type BcdTokenTransfersQueryParams = {
  network: BcdNetwork;
  address: string;
  last_id?: string;
  size?: number;
};

export type BcdOperationsSearchQueryParams = {
  network: BcdNetwork;
  address: string;
  offset?: number;
  since?: number;
};
