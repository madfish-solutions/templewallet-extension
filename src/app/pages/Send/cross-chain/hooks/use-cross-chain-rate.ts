import BigNumber from 'bignumber.js';
import { useDebounce } from 'use-debounce';

import { GetRateResponse } from 'lib/apis/exolix/types';
import { queryCrossChainRate } from 'lib/apis/exolix/utils';
import { CrossChainAsset } from 'lib/cross-chain';
import { useTypedSWR } from 'lib/swr';

// Intentionally tiny: always falls below Exolix min so the API surfaces the real min in its response.
const SEED_PROBE_AMOUNT = '0.00001';

interface RateArgs {
  from: CrossChainAsset;
  to: CrossChainAsset;
  amount: string;
}

export const useCrossChainRate = ({ from, to, amount }: RateArgs) => {
  const [debouncedAmount] = useDebounce(amount.trim(), 350);
  const parsed = new BigNumber(debouncedAmount || '0');
  const hasAmount = parsed.isFinite() && parsed.isGreaterThan(0);
  const probeAmount = hasAmount ? debouncedAmount : SEED_PROBE_AMOUNT;
  const probeKey = hasAmount ? debouncedAmount : `seed:${SEED_PROBE_AMOUNT}`;

  const key = ['cross-chain-rate', from.exolixCoin, from.exolixNetwork, to.exolixCoin, to.exolixNetwork, probeKey];

  return useTypedSWR<GetRateResponse>(
    key,
    () =>
      queryCrossChainRate({
        coinFrom: from.exolixCoin,
        coinFromNetwork: from.exolixNetwork,
        coinTo: to.exolixCoin,
        coinToNetwork: to.exolixNetwork,
        amount: probeAmount
      }),
    { refreshInterval: 10_000, revalidateOnFocus: false, dedupingInterval: 5_000 }
  );
};
