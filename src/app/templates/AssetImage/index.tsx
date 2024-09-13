import React, { memo } from 'react';

import { AssetMetadataBase, useEvmAssetMetadata, useTezosAssetMetadata } from 'lib/metadata';
import { EvmAssetMetadataBase } from 'lib/metadata/types';

import {
  TezosAssetImageStackedProps,
  TezosAssetImageStacked,
  EvmAssetImageStackedProps,
  EvmAssetImageStacked
} from './AssetImageStacked';

export type { TezosAssetImageStackedProps, EvmAssetImageStackedProps };
export { TezosAssetImageStacked };

export interface TezosAssetImageProps
  extends Omit<TezosAssetImageStackedProps, 'sources' | 'metadata' | 'loader' | 'fallback'> {
  tezosChainId: string;
  assetSlug: string;
  extraSrc?: string;
  Loader?: Placeholder<TezosAssetImageProps, AssetMetadataBase>;
  Fallback?: Placeholder<TezosAssetImageProps, AssetMetadataBase>;
}

export const TezosAssetImage = memo<TezosAssetImageProps>(({ Loader, Fallback, ...props }) => {
  const { tezosChainId, className, style, extraSrc, ...rest } = props;

  const metadata = useTezosAssetMetadata(props.assetSlug, tezosChainId);

  return (
    <TezosAssetImageStacked
      metadata={metadata}
      extraSrc={extraSrc}
      loader={Loader ? <Loader {...props} metadata={metadata} /> : undefined}
      fallback={Fallback ? <Fallback {...props} metadata={metadata} /> : undefined}
      {...rest}
    />
  );
});

export interface EvmAssetImageProps
  extends Omit<EvmAssetImageStackedProps, 'sources' | 'metadata' | 'loader' | 'fallback'> {
  evmChainId: number;
  assetSlug: string;
  extraSrc?: string;
  Loader?: Placeholder<EvmAssetImageProps, EvmAssetMetadataBase>;
  Fallback?: Placeholder<EvmAssetImageProps, EvmAssetMetadataBase>;
}

export const EvmAssetImage = memo<EvmAssetImageProps>(({ Loader, Fallback, ...props }) => {
  const { evmChainId, assetSlug, extraSrc, ...rest } = props;

  const metadata = useEvmAssetMetadata(assetSlug, evmChainId);

  return (
    <EvmAssetImageStacked
      evmChainId={evmChainId}
      metadata={metadata}
      extraSrc={extraSrc}
      loader={Loader ? <Loader {...props} metadata={metadata} /> : undefined}
      fallback={Fallback ? <Fallback {...props} metadata={metadata} /> : undefined}
      {...rest}
    />
  );
});

type Placeholder<P, M> = React.ComponentType<Omit<P, 'Loader' | 'Fallback'> & { metadata?: M }>;