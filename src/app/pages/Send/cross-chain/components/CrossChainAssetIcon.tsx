import React, { CSSProperties, memo } from 'react';

import clsx from 'clsx';

import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import { TOKEN_FALLBACK_ICON_SRC } from 'lib/icons';
import { CrossChainAsset } from 'lib/cross-chain';
import { TempleChainKind } from 'temple/types';

interface Props {
  asset: CrossChainAsset;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export const CrossChainAssetIcon = memo<Props>(({ asset, size = 32, className, style }) => {
  if (asset.chainKind === TempleChainKind.Tezos && asset.chainId != null && asset.assetSlug) {
    return (
      <TezosAssetIconWithNetwork
        tezosChainId={String(asset.chainId)}
        assetSlug={asset.assetSlug}
        size={size}
        className={className}
        style={style}
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
        style={style}
      />
    );
  }

  return (
    <div
      className={clsx('flex items-center justify-center', className)}
      style={{ width: size + 8, height: size + 8, ...style }}
    >
      <img
        src={asset.iconUrl ?? TOKEN_FALLBACK_ICON_SRC}
        alt={asset.exolixCoin}
        className="rounded-full"
        style={{ width: size, height: size }}
        onError={e => {
          if (e.currentTarget.src !== TOKEN_FALLBACK_ICON_SRC) e.currentTarget.src = TOKEN_FALLBACK_ICON_SRC;
        }}
      />
    </div>
  );
});
