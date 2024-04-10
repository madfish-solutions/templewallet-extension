type TokenSlugWithChainId = string;
export type EVMExchangeRateRecords = Record<TokenSlugWithChainId, number>;

export interface EVMCurrencyState {
  usdToTokenRates: EVMExchangeRateRecords;
}

export const evmCurrencyInitialState: EVMCurrencyState = {
  usdToTokenRates: {}
};
