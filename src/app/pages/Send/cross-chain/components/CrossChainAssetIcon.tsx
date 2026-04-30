import React, { memo } from 'react';

import clsx from 'clsx';

import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import { CurrencyIcon } from 'app/pages/Buy/CryptoExchange/components/CurrencyIcon';
import { CrossChainAsset } from 'lib/cross-chain';
import { TempleChainKind } from 'temple/types';

interface Props {
  asset: CrossChainAsset;
  /** Inner icon size in px. Wrapper renders at `size + 8`. */
  size?: number;
  className?: string;
}

/**
 * Single source of truth for cross-chain asset rendering.
 * Temple-known assets reuse the standard `<*AssetIconWithNetwork>` (curated metadata icons + chain badge).
 * The BTC pseudo-asset has no Temple chainKind/chainId, so it falls back to the Exolix CDN icon
 * via `<CurrencyIcon>` inside an identically-sized wrapper.
 */
export const CrossChainAssetIcon = memo<Props>(({ asset, size = 32, className }) => {
  if (asset.chainKind === TempleChainKind.Tezos && asset.chainId != null && asset.assetSlug) {
    return (
      <TezosAssetIconWithNetwork
        tezosChainId={String(asset.chainId)}
        assetSlug={asset.assetSlug}
        size={size}
        className={className}
      />
    );
  }

  if (asset.chainKind === TempleChainKind.EVM && asset.chainId != null && asset.assetSlug) {
    return (
      <EvmAssetIconWithNetwork
        evmChainId={Number(asset.chainId)}
        assetSlug={asset.assetSlug}
        size={size}
        className={className}
      />
    );
  }

  const wrapperSize = size + 8;
  return (
    <div
      className={clsx('flex items-center justify-center', className)}
      style={{ width: wrapperSize, height: wrapperSize }}
    >
      <CurrencyIcon src={asset.iconUrl ?? ''} code={asset.exolixCoin} size={size} />
    </div>
  );
});
