import { useCallback } from 'react';

import { TezosToolkit } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { Route3LiquidityBakingChains, Route3SwapChains } from 'lib/route3/interfaces';
import { getSwapTransferParams } from 'lib/utils/swap.utils';

export const useGetSwapTransferParams = (tezos: TezosToolkit, publicKeyHash: string) =>
  useCallback(
    async (
      fromRoute3Token: Route3Token,
      toRoute3Token: Route3Token,
      inputAmountAtomic: BigNumber,
      minimumReceivedAtomic: BigNumber,
      chains: Route3SwapChains | Route3LiquidityBakingChains
    ) =>
      getSwapTransferParams(
        fromRoute3Token,
        toRoute3Token,
        inputAmountAtomic,
        minimumReceivedAtomic,
        chains,
        tezos,
        publicKeyHash
      ),
    [tezos, publicKeyHash]
  );
