import { BigNumber } from 'bignumber.js';

import { axiosClient } from '../client';

interface RawDealsBalanceResponse {
  pendingUsdt: string;
  lastPendingAmount: string | null;
  rateStale: boolean;
}

export interface DealsBalance {
  pendingUsdt: BigNumber;
  lastPendingAmount: BigNumber | null;
  rateStale: boolean;
}

export const fetchDealsPendingBalance = async (address: string): Promise<DealsBalance> => {
  const { data } = await axiosClient.get<RawDealsBalanceResponse>('/temple/deals/balance', { params: { address } });

  return {
    pendingUsdt: new BigNumber(data.pendingUsdt),
    lastPendingAmount: data.lastPendingAmount !== null ? new BigNumber(data.lastPendingAmount) : null,
    rateStale: data.rateStale
  };
};
