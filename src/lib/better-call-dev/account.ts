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

export type BcdGetTokenBalancesParams = {
  network: BcdNetwork;
  address: string;
  offset?: number;
  size?: number;
  contract?: string;
};

export const getAccountTokenBalances = buildQuery<
  BcdGetTokenBalancesParams,
  BcdAccountTokenBalances
>(
  "GET",
  (params) => `/account/${params.network}/${params.address}/token_balances`,
  ["offset", "size", "contract"]
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

export interface BcdAccountTokenBalances {
  balances: BcdAccountTokenBalance[];
  total: number;
}

export interface BcdAccountTokenBalance {
  network: string;
  balance: string;
  contract: string;
  token_id: number;
  creators?: string[];
  decimals?: number;
  description?: string;
  display_uri?: string;
  external_uri?: string;
  formats?: any[];
  is_boolean_amount?: boolean;
  is_transferable?: boolean;
  level?: number;
  name?: string;
  should_prefer_symbol?: boolean;
  symbol?: string;
  tags?: string[];
  thumbnail_uri?: string;
  artifact_uri?: string;
  token_info?: any;
  volume_24_hours?: number;
}
