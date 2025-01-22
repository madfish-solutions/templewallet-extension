import React, { memo, useMemo } from 'react';

import { useGetEvmChainAssetMetadata } from 'lib/metadata';
import { EvmChain } from 'temple/front';

import { EvmAssetIcon } from '../AssetIcon';

import { ExpensesViewLayout, ExpensesViewRowProps } from './expenses-view-layout';
import { ExpensesViewProps } from './types';

export const EvmExpensesView = memo<ExpensesViewProps<EvmChain>>(({ assetsDeltas, chain, title }) => {
  const { chainId } = chain;
  const getMetadata = useGetEvmChainAssetMetadata(chainId);

  const rows = useMemo<ExpensesViewRowProps[]>(() => {
    return Object.entries(assetsDeltas).map(([assetSlug, atomicAmount]) => {
      const assetMetadata = getMetadata(assetSlug);

      return {
        icon: <EvmAssetIcon evmChainId={chainId} assetSlug={assetSlug} size={24} />,
        atomicAmount,
        decimals: assetMetadata?.decimals,
        symbol: assetMetadata?.symbol,
        displayFiatValue: true,
        chainId,
        assetSlug
      };
    });
  }, [assetsDeltas, chainId, getMetadata]);

  return <ExpensesViewLayout title={title} rows={rows} />;
});
