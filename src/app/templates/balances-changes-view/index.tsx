import React, { memo, useMemo } from 'react';

import { Loader } from 'app/atoms';
import { useOperationConfirmationCardRowsPropsPart } from 'app/hooks/use-operation-confirmation-card-rows-props-part';
import { t } from 'lib/i18n';
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

import { BalancesChangesViewLayout, GroupedBalancesChangesViewLayout } from './layout';
import { BalancesChangesViewProps } from './types';

function BalancesChangesViewHOC<
  C extends OneOfChains,
  TM extends EvmTokenMetadata | EvmNativeTokenMetadata | AssetMetadataBase,
  CM extends EvmCollectibleMetadata | TezosCollectibleMetadata
>(
  useTokenOrGasMetadataGetter: (chainId: C['chainId']) => (assetSlug: string) => TM | undefined,
  useCollectibleMetadataGetter: (chainId: C['chainId']) => (assetSlug: string) => CM | undefined,
  useNoCategoryMetadataGetter: (chainId: C['chainId']) => (assetSlug: string) => TM | CM | undefined,
  useGenericAssetsMetadataCheck: (chainSlugsToCheck: string[]) => boolean
) {
  return memo<BalancesChangesViewProps<C>>(({ title, balancesChanges, chain, bridgeData, footer }) => {
    const { chainId } = chain;
    const getCollectibleMetadata = useCollectibleMetadataGetter(chainId);

    const inputChanges = bridgeData ? { ...balancesChanges[0] } : Object.assign({}, ...balancesChanges);
    const outputChanges = bridgeData ? Object.assign({}, ...balancesChanges.slice(1)) : {};

    const { rows: inputRows, metadataLoading: inputMetadataLoading } = useOperationConfirmationCardRowsPropsPart(
      bridgeData ? (bridgeData.inputNetwork as C) : chain,
      inputChanges,
      useTokenOrGasMetadataGetter,
      useCollectibleMetadataGetter,
      useNoCategoryMetadataGetter,
      useGenericAssetsMetadataCheck
    );

    const { rows: outputRows, metadataLoading: outputMetadataLoading } = useOperationConfirmationCardRowsPropsPart(
      bridgeData ? (bridgeData.outputNetwork as C) : chain,
      outputChanges,
      useTokenOrGasMetadataGetter,
      useCollectibleMetadataGetter,
      useNoCategoryMetadataGetter,
      useGenericAssetsMetadataCheck
    );

    const metadataLoading = inputMetadataLoading || outputMetadataLoading;

    const allAssetsAreCollectibles = useMemo(
      () =>
        Object.entries(balancesChanges).every(([slug, { isNft }]) => Boolean(getCollectibleMetadata(slug)) || isNft),
      [balancesChanges, getCollectibleMetadata]
    );

    return (
      <>
        <div className={metadataLoading ? 'hidden' : undefined}>
          {bridgeData ? (
            <GroupedBalancesChangesViewLayout
              title={t('simulatedResult')}
              rows={[...inputRows, ...outputRows]}
              footer={footer}
            />
          ) : (
            <BalancesChangesViewLayout
              title={title ?? (allAssetsAreCollectibles ? t('estimatedTxDetails') : t('simulatedResult'))}
              rows={inputRows}
              footer={footer}
            />
          )}
        </div>
        {metadataLoading && (
          <div className="flex justify-center items-center">
            <Loader size="L" trackVariant="dark" className="text-secondary" />
          </div>
        )}
      </>
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

export const BalancesChangesView = memo<BalancesChangesViewProps>(({ chain, bridgeData, ...rest }) => {
  if (chain.kind === TempleChainKind.Tezos) {
    return <TezosBalancesChangesView {...rest} chain={chain} bridgeData={bridgeData} />;
  }

  return <EvmBalancesChangesView {...rest} chain={chain} bridgeData={bridgeData} />;
});
