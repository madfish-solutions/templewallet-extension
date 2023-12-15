import { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { useBalancesSelector } from 'app/store/balances/selectors';
import { ASSETS_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAssetMetadata } from 'lib/metadata';
import { useRetryableSWR } from 'lib/swr';
import { useTezos, ReactiveTezosToolkit } from 'lib/temple/front';
import { useAccount, useChainId } from 'lib/temple/front/ready';
import { michelEncoder, loadFastRpcClient } from 'lib/temple/helpers';

import { fetchBalance } from './fetch';
import { getBalanceSWRKey } from './utils';

export const useAccountBalances = () => {
  const { publicKeyHash } = useAccount();
  const chainId = useChainId(true)!;

  return useBalancesSelector(publicKeyHash, chainId);
};

type UseBalanceOptions = {
  suspense?: boolean;
  networkRpc?: string;
  displayed?: boolean;
  initial?: BigNumber;
};

export function useBalance(assetSlug: string, address: string, opts: UseBalanceOptions = {}) {
  const nativeTezos = useTezos();
  const assetMetadata = useAssetMetadata(assetSlug);

  const tezos = useMemo(() => {
    if (opts.networkRpc) {
      const rpc = opts.networkRpc;
      const t = new ReactiveTezosToolkit(loadFastRpcClient(rpc), rpc);
      t.setPackerProvider(michelEncoder);
      return t;
    }
    return nativeTezos;
  }, [opts.networkRpc, nativeTezos]);

  const fetchBalanceLocal = useCallback(async () => {
    if (assetMetadata) return fetchBalance(tezos, assetSlug, address, assetMetadata);
    throw new Error('Metadata missing, when fetching balance');
  }, [tezos, address, assetSlug, assetMetadata]);

  const displayed = opts.displayed ?? true;

  return useRetryableSWR(displayed ? getBalanceSWRKey(tezos, assetSlug, address) : null, fetchBalanceLocal, {
    suspense: opts.suspense ?? true,
    revalidateOnFocus: false,
    dedupingInterval: 20_000,
    fallbackData: opts.initial,
    refreshInterval: ASSETS_SYNC_INTERVAL
  });
}
