export type BcdNetwork =
  | "carthagenet"
  | "dalphanet"
  | "mainnet"
  | "delphinet"
  | "dalphanet";
export type BcdContractType = "fa1" | "fa12";

export interface BcdApiError {
  message: string;
}

export interface BcdTokenMethodStats {
  average_consumed_gas: number;
  call_count: number;
}

export interface BcdRawTokenContract {
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

export interface BcdTokenContract
  extends Omit<BcdRawTokenContract, "last_action" | "timestamp"> {
  last_action: Date;
  timestamp: Date;
}

export interface BcdRawPageableTokenContracts {
  last_id: number;
  tokens: BcdRawTokenContract[];
  total: number;
}

export interface BcdPageableTokenContracts {
  last_id: number;
  tokens: BcdTokenContract[];
  total: number;
}

export interface BcdRawTokenTransfer {
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
}

export interface BcdTokenTransfer
  extends Omit<BcdRawTokenTransfer, "timestamp"> {
  timestamp: Date;
}

export interface BcdRawPageableTokenTransfers {
  last_id?: string;
  transfers: BcdRawTokenTransfer[];
}

export interface BcdPageableTokenTransfers {
  last_id?: string;
  transfers: BcdTokenTransfer[];
}

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
