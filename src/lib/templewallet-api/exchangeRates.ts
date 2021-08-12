import makeBuildQueryFn from "lib/makeBuildQueryFn";

import { TokensExchangeRatesEntry } from "./types";

const buildQuery = makeBuildQueryFn<Record<string, unknown>, any>(
  "https://api.templewallet.com/api"
);

export const getTokensExchangeRates = buildQuery<
  {},
  TokensExchangeRatesEntry[]
>("GET", "/exchange-rates");
