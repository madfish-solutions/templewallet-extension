import React, { ReactNode, memo, useMemo } from 'react';

import {
  AssetMetadataBase,
  TokenMetadata as TezosCollectibleMetadata,
  useGetEvmChainCollectibleMetadata,
  useGetEvmChainTokenOrGasMetadata,
  useGetChainTokenOrGasMetadata as useGetTezosChainTokenOrGasMetadata,
  useGetCollectibleMetadata as useGetTezosCollectibleMetadata
} from 'lib/metadata';
import { EvmCollectibleMetadata, EvmNativeTokenMetadata, EvmTokenMetadata } from 'lib/metadata/types';
import { EvmChain, OneOfChains, TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EvmAssetIcon, TezosAssetIcon } from '../AssetIcon';

import { ExpensesViewLayout, ExpensesViewRowProps, ExpensesViewRowVariant } from './expenses-view-layout';
import { ExpensesViewProps } from './types';

function ExpensesViewHOC<
  C extends OneOfChains,
  TM extends EvmTokenMetadata | EvmNativeTokenMetadata | AssetMetadataBase,
  CM extends EvmCollectibleMetadata | TezosCollectibleMetadata
>(
  useTokenOrGasMetadataGetter: (chainId: C['chainId']) => (assetSlug: string) => TM | undefined,
  useCollectibleMetadataGetter: (chainId: C['chainId']) => (assetSlug: string) => CM | undefined,
  renderIcon: (chainId: C['chainId'], assetSlug: string, size: number) => ReactNode
) {
  return memo<ExpensesViewProps<C>>(({ assetsDeltas, chain, title }) => {
    const { chainId } = chain;
    const getTokenOrGasMetadata = useTokenOrGasMetadataGetter(chainId);
    const getCollectibleMetadata = useCollectibleMetadataGetter(chainId);

    const allAssetsAreCollectibles = useMemo(
      () => Object.keys(assetsDeltas).every(slug => getCollectibleMetadata(slug)),
      [assetsDeltas, getCollectibleMetadata]
    );

    const rows = useMemo<ExpensesViewRowProps[]>(
      () =>
        Object.entries(assetsDeltas).map(([assetSlug, atomicAmount]) => {
          const tokenOrGasMetadata = getTokenOrGasMetadata(assetSlug);
          const collectibleMetadata = getCollectibleMetadata(assetSlug);
          console.log('toofta 1', assetSlug, collectibleMetadata);

          return {
            icon: renderIcon(chainId, assetSlug, allAssetsAreCollectibles ? 36 : 24),
            atomicAmount,
            decimals: (tokenOrGasMetadata ?? collectibleMetadata)?.decimals,
            symbol: collectibleMetadata
              ? ('collectibleName' in collectibleMetadata ? collectibleMetadata.collectibleName : undefined) ??
                collectibleMetadata.name ??
                collectibleMetadata.symbol
              : tokenOrGasMetadata?.symbol ?? tokenOrGasMetadata?.name,
            chainId,
            assetSlug,
            evm: chain.kind === TempleChainKind.EVM,
            variant: allAssetsAreCollectibles
              ? ExpensesViewRowVariant.AllCollectibles
              : collectibleMetadata
              ? ExpensesViewRowVariant.Collectible
              : ExpensesViewRowVariant.Token
          };
        }),
      [assetsDeltas, chain.kind, chainId, getTokenOrGasMetadata, getCollectibleMetadata, allAssetsAreCollectibles]
    );

    return <ExpensesViewLayout title={title} rows={rows} />;
  });
}

const TezosExpensesView = ExpensesViewHOC<TezosChain, AssetMetadataBase, TezosCollectibleMetadata>(
  useGetTezosChainTokenOrGasMetadata,
  useGetTezosCollectibleMetadata,
  (chainId, assetSlug, size) => <TezosAssetIcon tezosChainId={chainId} assetSlug={assetSlug} size={size} />
);
const EvmExpensesView = ExpensesViewHOC<EvmChain, EvmTokenMetadata | EvmNativeTokenMetadata, EvmCollectibleMetadata>(
  useGetEvmChainTokenOrGasMetadata,
  useGetEvmChainCollectibleMetadata,
  (chainId, assetSlug, size) => <EvmAssetIcon evmChainId={chainId} assetSlug={assetSlug} size={size} />
);

export const ExpensesView = memo<ExpensesViewProps>(({ assetsDeltas, chain, title }) => {
  if (chain.kind === TempleChainKind.Tezos) {
    return <TezosExpensesView assetsDeltas={assetsDeltas} chain={chain} title={title} />;
  }

  return <EvmExpensesView assetsDeltas={assetsDeltas} chain={chain} title={title} />;
});
