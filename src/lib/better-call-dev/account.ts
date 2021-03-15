import { BcdNetwork, buildQuery } from "./base";

/**
 * Queries
 */

export type BcdGetAccountParams = {
  network: BcdNetwork;
  address: string;
};

export const getAccount = buildQuery<BcdGetAccountParams, BcdAccountInfo>(
  "GET",
  (params) => `/account/${params.network}/${params.address}`
);

export type BcdGetAccountMetadataParams = {
  network: BcdNetwork;
  address: string;
};

export const getAccountMetadata = buildQuery<BcdGetAccountMetadataParams, any>(
  "GET",
  (params) => `/account/${params.network}/${params.address}/metadata`
);

/**
 * Types
 */

export interface BcdAccountInfo {
  address: string;
  alias: string;
  balance: number;
  last_action: string;
  network: string;
  tokens: BcdAccountToken[];
  tx_count: number;
}

export interface BcdAccountToken {
  balance: number;
  contract: string;
  network: string;
  token_id: number;
}
