import { BigNumber } from 'bignumber.js';

import { EnvVars } from 'lib/env';

interface RawDealsBalanceResponse {
  pendingUsdt: string;
}

export interface DealsBalance {
  pendingUsdt: BigNumber;
}

export const parseDealsBalanceResponse = (raw: RawDealsBalanceResponse): DealsBalance => ({
  pendingUsdt: new BigNumber(raw.pendingUsdt)
});

export const fetchDealsPendingBalance = async (address: string): Promise<DealsBalance> => {
  const params = new URLSearchParams({ address });
  const url = `${EnvVars.TEMPLE_ADS_API_URL}/temple-deals/balance?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`fetchDealsPendingBalance failed: ${response.status}`);
  }
  const raw: RawDealsBalanceResponse = await response.json();
  return parseDealsBalanceResponse(raw);
};
