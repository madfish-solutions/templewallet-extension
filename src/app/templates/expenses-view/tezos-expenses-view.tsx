import React, { memo, useMemo } from 'react';

import { useGetAssetMetadata } from 'lib/metadata';
import { TezosChain } from 'temple/front';

import { TezosAssetIcon } from '../AssetIcon';

import { ExpensesViewLayout, ExpensesViewRowProps } from './expenses-view-layout';
import { ExpensesViewProps } from './types';

export const TezosExpensesView = memo<ExpensesViewProps<TezosChain>>(({ assetsDeltas, chain, title }) => {
  const { chainId } = chain;
  const getMetadata = useGetAssetMetadata(chainId);

  const rows = useMemo<ExpensesViewRowProps[]>(() => {
    return Object.entries(assetsDeltas).map(([assetSlug, atomicAmount]) => {
      const assetMetadata = getMetadata(assetSlug);

      return {
        icon: <TezosAssetIcon tezosChainId={chainId} assetSlug={assetSlug} size={24} />,
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
