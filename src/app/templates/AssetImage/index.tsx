import React, { memo } from 'react';

import { useLifiEvmTokenMetadataSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { AssetMetadataBase, useEvmGenericAssetMetadata, useGenericTezosAssetMetadata } from 'lib/metadata';
import { EvmAssetMetadataBase } from 'lib/metadata/types';

import {
  TezosAssetImageStackedProps,
  TezosAssetImageStacked,
  EvmAssetImageStackedProps,
  EvmAssetImageStacked
} from './AssetImageStacked';

export { TezosAssetImageStacked };

export interface TezosAssetImageProps extends Omit<TezosAssetImageStackedProps, 'sources' | 'metadata'> {
  tezosChainId: string;
  assetSlug: string;
  Loader?: Placeholder<TezosAssetImageProps, AssetMetadataBase>;
  Fallback?: Placeholder<TezosAssetImageProps, AssetMetadataBase>;
}

export const TezosAssetImage = memo<TezosAssetImageProps>(({ Loader, Fallback, ...props }) => {
  const { tezosChainId, assetSlug, ...rest } = props;

  const metadata = useGenericTezosAssetMetadata(assetSlug, tezosChainId);

  return (
    <TezosAssetImageStacked
      metadata={metadata}
      loader={Loader ? <Loader {...props} metadata={metadata} /> : undefined}
      fallback={Fallback ? <Fallback {...props} metadata={metadata} /> : undefined}
      {...rest}
    />
  );
});

export interface EvmAssetImageProps extends Omit<EvmAssetImageStackedProps, 'sources' | 'metadata'> {
  evmChainId: number;
  assetSlug: string;
  Loader?: Placeholder<EvmAssetImageProps, EvmAssetMetadataBase>;
  Fallback?: Placeholder<EvmAssetImageProps, EvmAssetMetadataBase>;
  metadata?: EvmAssetMetadataBase;
}

export const EvmAssetImage = memo<EvmAssetImageProps>(({ Loader, Fallback, metadata: metadataOverrides, ...props }) => {
  const { evmChainId, assetSlug, ...rest } = props;

  const storedMetadata = useEvmGenericAssetMetadata(assetSlug, evmChainId);
  const lifiMetadata = useLifiEvmTokenMetadataSelector(evmChainId, assetSlug);
  const metadata = metadataOverrides ?? storedMetadata?.address ? storedMetadata : lifiMetadata;

  return (
    <EvmAssetImageStacked
      evmChainId={evmChainId}
      metadata={metadata}
      extraSrc={lifiMetadata?.logoURI}
      loader={Loader ? <Loader {...props} metadata={metadata} /> : undefined}
      fallback={Fallback ? <Fallback {...props} metadata={metadata} /> : undefined}
      {...rest}
    />
  );
});

type Placeholder<P, M> = React.ComponentType<Omit<P, 'Loader' | 'Fallback'> & { metadata?: M }>;
