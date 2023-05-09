type TokenSlug = string;

export interface DAppsState {
  tokensApyRates: Record<TokenSlug, number>;
}

export const dAppsInitialState: DAppsState = {
  tokensApyRates: {}
};
