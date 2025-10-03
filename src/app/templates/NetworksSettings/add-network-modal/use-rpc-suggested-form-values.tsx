import { useCallback, useMemo } from 'react';

import { omit } from 'lodash';
import useSWR from 'swr';
import { useDebounce } from 'use-debounce';

import { loadEvmChainId } from 'temple/evm';
import { getViemChainsList } from 'temple/evm/utils';
import { loadTezosChainId } from 'temple/tezos/utils';

import { makeFormValues } from '../utils';

import { ViemChain } from './types';

export const useRpcSuggestedFormValues = (rpcUrl: string, rpcUrlsToExclude: string[]) => {
  const [rpcUrlDebounced] = useDebounce(rpcUrl, 500);
  const getValuesFromRpcUrl = useCallback(
    async ([, newRpcUrl]: [string, string]) => {
      if (!newRpcUrl || rpcUrlsToExclude.includes(newRpcUrl)) {
        return null;
      }

      const allViemChains: ViemChain[] = getViemChainsList();
      let viemChain = allViemChains.find(({ rpcUrls }: ViemChain) =>
        Object.values(rpcUrls)
          .flat()
          .some(({ http }) => http.includes(newRpcUrl))
      );

      if (viemChain) {
        return omit(makeFormValues(viemChain), 'name', 'rpcUrl');
      }

      const [evmResult, tezosResult] = await Promise.allSettled([
        loadEvmChainId(newRpcUrl),
        loadTezosChainId(newRpcUrl)
      ]);

      if (tezosResult.status === 'fulfilled') {
        return {
          chainId: tezosResult.value,
          symbol: 'TEZ',
          explorerUrl: '',
          testnet: true
        };
      }

      if (evmResult.status === 'rejected') {
        return null;
      }

      viemChain = allViemChains.find(({ id }: ViemChain) => id === evmResult.value);

      if (viemChain) {
        return omit(makeFormValues(viemChain), 'name', 'rpcUrl');
      }

      return {
        chainId: String(evmResult.value),
        symbol: '',
        explorerUrl: '',
        testnet: true
      };
    },
    [rpcUrlsToExclude]
  );
  const rpcUrlsToExcludeKeyPart = useMemo(
    // '+' operator is used for performance reasons
    () => rpcUrlsToExclude.reduce((acc, url) => acc + url + ' ', ''),
    [rpcUrlsToExclude]
  );

  return useSWR(['new-network-values-from-rpc', rpcUrlDebounced, rpcUrlsToExcludeKeyPart], getValuesFromRpcUrl, {
    suspense: false
  });
};
