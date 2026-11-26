import { useRef } from 'react';

import type { Route as LiFiRoute } from '@lifi/sdk';

import { getAlchemyWalletConfig } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import type { AlchemyWalletConfig } from 'lib/evm/alchemy/types';
import { useGetEvmGasOrTokenMetadata } from 'lib/metadata';
import { AccountForChain } from 'temple/accounts';
import { useAllEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { Route3EvmRoute } from '../../form/interfaces';
import { MIN_QUOTE_TIME_LEFT_MS } from '../constants';
import { PreparedEvmSwap } from '../types';
import { useSwapPreparation } from '../use-swap-preparation';

import { prepareEvmSwap } from './prepare-evm-swap';

interface EvmSwapPreparationParams {
  account: AccountForChain<TempleChainKind.EVM>;
  accountPkh: HexString;
  draftKey: string | null;
  route: LiFiRoute | Route3EvmRoute | null;
  routeLoading: boolean;
}

export const useEvmSwapPreparation = ({
  account,
  accountPkh,
  draftKey,
  route,
  routeLoading
}: EvmSwapPreparationParams) => {
  const allEvmChains = useAllEvmChains();
  const getEvmMetadata = useGetEvmGasOrTokenMetadata();
  const walletConfigRef = useRef<AlchemyWalletConfig>(undefined);

  return useSwapPreparation<PreparedEvmSwap>({
    draftKey,
    ready: Boolean(route) && !routeLoading,
    prepare: signal =>
      route
        ? prepareEvmSwap(
            {
              account,
              route,
              ctx: { accountPkh, chains: allEvmChains, getMetadata: getEvmMetadata },
              getWalletConfig: async configSignal =>
                (walletConfigRef.current ??= await getAlchemyWalletConfig(configSignal))
            },
            signal
          )
        : Promise.reject(new Error('No route')),
    isUsable: prepared =>
      prepared.route === route &&
      (prepared.path === 'steps' || prepared.firstAction.quote.expiresAt - Date.now() >= MIN_QUOTE_TIME_LEFT_MS)
  });
};
