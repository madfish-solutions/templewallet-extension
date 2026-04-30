import { useDebounce } from 'use-debounce';

import { queryCrossChainRate } from 'lib/apis/exolix/cross-chain';
import { GetRateResponse } from 'lib/apis/exolix/types';
import { CrossChainAsset } from 'lib/cross-chain';
import { useTypedSWR } from 'lib/swr';

const SEED_PROBE_AMOUNT = 0.00001;

interface RateArgs {
  from: CrossChainAsset;
  to: CrossChainAsset;
  amount: string;
}

export const useCrossChainRate = ({ from, to, amount }: RateArgs) => {
  const [debouncedAmount] = useDebounce(amount.trim(), 350);
  const parsedAmount = parseFloat(debouncedAmount || '0');
  const probeAmount = parsedAmount > 0 ? parsedAmount : SEED_PROBE_AMOUNT;
  const probeKey = parsedAmount > 0 ? debouncedAmount : `seed:${SEED_PROBE_AMOUNT}`;

  const key = [
    'cross-chain-rate',
    from.exolixCoin,
    from.exolixNetwork,
    to.exolixCoin,
    to.exolixNetwork,
    probeKey
  ];

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
