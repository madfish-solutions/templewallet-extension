import { useCallback } from 'react';

import { TezosToolkit } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { Route3SwapHops, Route3LiquidityBakingHops } from 'lib/route3/interfaces';
import { getSwapTransferParams } from 'lib/utils/swap.utils';

export const useGetTezosSwapTransferParams = (tezos: TezosToolkit, publicKeyHash: string) =>
  useCallback(
    async (
      fromRoute3Token: Route3Token,
      toRoute3Token: Route3Token,
      inputAmountAtomic: BigNumber,
      expectedReceivedAtomic: BigNumber,
      slippageRatio: number,
      hops: Route3SwapHops | Route3LiquidityBakingHops
    ) =>
      getSwapTransferParams(
        fromRoute3Token,
        toRoute3Token,
        inputAmountAtomic,
        expectedReceivedAtomic,
        slippageRatio,
        hops,
        tezos,
        publicKeyHash
      ),
    [tezos, publicKeyHash]
  );
