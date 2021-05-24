import makeBuildQueryFn from "lib/makeBuildQueryFn";

import { TokensExchangeRatesEntry } from "./types";

const buildQuery = makeBuildQueryFn<Record<string, unknown>, any>(
  "http://104.236.217.192/api"
);

export const getTokensExchangeRates = buildQuery<
  {},
  TokensExchangeRatesEntry[]
>("GET", "/exchange-rates");
