import { BcdNetwork, buildQuery } from "./base";

/**
 * Queries
 */

export type BcdTokenTransfersParams = {
  network: BcdNetwork;
  address: string;
  last_id?: string;
  size?: number;
  sort?: "asc" | "desc";
  start?: number;
  end?: number;
  contracts?: string;
  token_id?: number;
};

export const getTokenTransfers = buildQuery<
  BcdTokenTransfersParams,
  BcdTokenTransfers
>("GET", (params) => `/tokens/${params.network}/transfers/${params.address}`, [
  "last_id",
  "size",
  "sort",
  "start",
  "end",
  "contracts",
  "token_id",
]);

/**
 * Types
 */

export interface BcdTokenTransfers {
  last_id?: string;
  total: number;
  transfers: BcdTokenTransfer[];
}

export interface BcdTokenTransfer {
  alias?: string;
  amount: string;
  contract: string;
  counter: number;
  from: string;
  from_alias?: string;
  hash: string;
  indexed_time: number;
  initiator: string;
  initiator_alias?: string;
  level: number;
  network: BcdNetwork;
  nonce: number;
  parent: string;
  status: string;
  timestamp: string;
  to: string;
  to_alias?: string;
  token: {
    contract: string;
    decimals?: number;
    level?: number;
    name?: string;
    network: string;
    symbol?: string;
    token_id: number;
    token_info?: any;
    volume_24_hours?: number;
  };
  token_id?: number;
}
