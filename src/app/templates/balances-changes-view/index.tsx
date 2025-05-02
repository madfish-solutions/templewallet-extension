import React, { memo, useMemo } from 'react';

import { useOperationConfirmationCardRowsPropsPart } from 'app/hooks/use-operation-confirmation-card-rows-props-part';
import { T } from 'lib/i18n';
import {
  AssetMetadataBase,
  TokenMetadata as TezosCollectibleMetadata,
  useEvmGenericAssetsMetadataCheck,
  useGetEvmChainCollectibleMetadata,
  useGetEvmChainTokenOrGasMetadata,
  useGetEvmNoCategoryAssetMetadata,
  useGetNoCategoryAssetMetadata,
  useGetChainTokenOrGasMetadata as useGetTezosChainTokenOrGasMetadata,
  useGetCollectibleMetadata as useGetTezosCollectibleMetadata,
  useTezosGenericAssetsMetadataCheck
} from 'lib/metadata';
import { EvmCollectibleMetadata, EvmNativeTokenMetadata, EvmTokenMetadata } from 'lib/metadata/types';
import { EvmChain, OneOfChains, TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { BalancesChangesViewLayout } from './layout';
import { BalancesChangesViewProps } from './types';

function BalancesChangesViewHOC<
  C extends OneOfChains,
  TM extends EvmTokenMetadata | EvmNativeTokenMetadata | AssetMetadataBase,
  CM extends EvmCollectibleMetadata | TezosCollectibleMetadata
>(
  useTokenOrGasMetadataGetter: (chainId: C['chainId']) => (assetSlug: string) => TM | undefined,
  useCollectibleMetadataGetter: (chainId: C['chainId']) => (assetSlug: string) => CM | undefined,
  useNoCategoryMetadataGetter: (chainId: C['chainId']) => (assetSlug: string) => TM | CM | undefined,
  useGenericAssetsMetadataCheck: (chainSlugsToCheck: string[]) => void
) {
  return memo<BalancesChangesViewProps<C>>(({ title, balancesChanges, chain }) => {
    const { chainId } = chain;
    const getCollectibleMetadata = useCollectibleMetadataGetter(chainId);

    const allAssetsAreCollectibles = useMemo(
      () =>
        Object.entries(balancesChanges).every(([slug, { isNft }]) => Boolean(getCollectibleMetadata(slug)) || isNft),
      [balancesChanges, getCollectibleMetadata]
    );

    const rows = useOperationConfirmationCardRowsPropsPart(
      chain,
      balancesChanges,
      useTokenOrGasMetadataGetter,
      useCollectibleMetadataGetter,
      useNoCategoryMetadataGetter,
      useGenericAssetsMetadataCheck
    );

    return (
      <BalancesChangesViewLayout
        title={title ?? (allAssetsAreCollectibles ? <T id="estimatedTxDetails" /> : <T id="transactionInfo" />)}
        rows={rows}
      />
    );
  });
}

const TezosBalancesChangesView = BalancesChangesViewHOC<TezosChain, AssetMetadataBase, TezosCollectibleMetadata>(
  useGetTezosChainTokenOrGasMetadata,
  useGetTezosCollectibleMetadata,
  useGetNoCategoryAssetMetadata,
  useTezosGenericAssetsMetadataCheck
);
const EvmBalancesChangesView = BalancesChangesViewHOC<
  EvmChain,
  EvmTokenMetadata | EvmNativeTokenMetadata,
  EvmCollectibleMetadata
>(
  useGetEvmChainTokenOrGasMetadata,
  useGetEvmChainCollectibleMetadata,
  useGetEvmNoCategoryAssetMetadata,
  useEvmGenericAssetsMetadataCheck
);

export const BalancesChangesView = memo<BalancesChangesViewProps>(({ chain, ...rest }) => {
  if (chain.kind === TempleChainKind.Tezos) {
    return <TezosBalancesChangesView {...rest} chain={chain} />;
  }

  return <EvmBalancesChangesView {...rest} chain={chain} />;
});
