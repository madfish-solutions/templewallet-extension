import React, { FC, PropsWithChildren, ReactNode, memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import Money from 'app/atoms/Money';
import { ReactComponent as UnknownCollectible } from 'app/icons/unknown-collectible.svg';
import { ReactComponent as UnknownToken } from 'app/icons/unknown-token.svg';
import { t } from 'lib/i18n';
import { EvmChain, TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EvmAssetIcon, EvmAssetIconWithNetwork, TezosAssetIcon } from '../AssetIcon';
import { ShortenedTextWithTooltip } from '../shortened-text-with-tooltip';

const CollectibleIconFallback = memo<{ size?: number }>(({ size = 24 }) => (
  <UnknownCollectible style={{ width: size, height: size }} />
));

const TokenIconFallback = memo<{ size?: number }>(({ size = 24 }) => (
  <UnknownToken style={{ width: size, height: size }} />
));

interface OperationConfirmationCardProps {
  title: ReactChildren;
}

export const OperationConfirmationCard: FC<PropsWithChildren<OperationConfirmationCardProps>> = ({
  title,
  children
}) => (
  <div className="bg-white p-4 pb-2 border-0.5 border-lines rounded-lg flex flex-col gap-3">
    {title && <p className="text-font-description-bold text-grey-1">{title}</p>}
    <div className="flex flex-col gap-2">{children}</div>
  </div>
);

export enum OperationConfirmationCardRowVariant {
  Token = 'Token',
  Collectible = 'Collectibles',
  AllCollectibles = 'AllCollectibles'
}

interface OperationConfirmationCardRowProps {
  chain: Pick<TezosChain, 'chainId' | 'kind'> | Pick<EvmChain, 'chainId' | 'kind'>;
  assetSlug: string;
  variant: OperationConfirmationCardRowVariant;
  amountClassName?: string;
  volume: BigNumber | string;
  symbol?: string;
  rightContent?: ReactNode;
  bridge?: boolean;
  withSign?: boolean;
}

export const OperationConfirmationCardRow = memo<OperationConfirmationCardRowProps>(
  ({ chain, assetSlug, variant, amountClassName, volume, symbol, rightContent, bridge, withSign }) => {
    const allCollectibles = variant === OperationConfirmationCardRowVariant.AllCollectibles;
    const isCollectible = allCollectibles || variant === OperationConfirmationCardRowVariant.Collectible;
    const Fallback = isCollectible ? CollectibleIconFallback : TokenIconFallback;

    const icon = useMemo(() => {
      const size = allCollectibles ? 36 : 24;

      if (chain.kind === TempleChainKind.EVM) {
        return bridge ? (
          <EvmAssetIconWithNetwork
            evmChainId={chain.chainId}
            assetSlug={assetSlug}
            size={size}
            Loader={Fallback}
            Fallback={Fallback}
          />
        ) : (
          <EvmAssetIcon
            evmChainId={chain.chainId}
            assetSlug={assetSlug}
            size={size}
            Loader={Fallback}
            Fallback={Fallback}
          />
        );
      }

      return (
        <TezosAssetIcon
          tezosChainId={chain.chainId}
          assetSlug={assetSlug}
          size={size}
          Loader={Fallback}
          Fallback={Fallback}
        />
      );
    }, [Fallback, allCollectibles, assetSlug, bridge, chain.chainId, chain.kind]);

    return (
      <div className={clsx('flex items-center', allCollectibles ? 'gap-2' : 'gap-1')}>
        {icon}
        <div className={clsx('flex flex-1 gap-1 items-center text-font-num-bold-16 min-w-0', amountClassName)}>
          {isCollectible ? (
            <>
              <DisplayVolume volume={volume} withSign={withSign} />
              <ShortenedTextWithTooltip>{symbol ?? t('unknownToken')}</ShortenedTextWithTooltip>
            </>
          ) : (
            <>
              <DisplayVolume volume={volume} withSign={withSign} />
              <ShortenedTextWithTooltip>
                {symbol ?? (isCollectible ? t('unknownToken') : t('unknownTokenAcronym'))}
              </ShortenedTextWithTooltip>
            </>
          )}
        </div>
        {rightContent}
      </div>
    );
  }
);

const DisplayVolume = memo<Pick<OperationConfirmationCardRowProps, 'volume' | 'withSign'>>(({ volume, withSign }) =>
  typeof volume === 'string' ? (
    <ShortenedTextWithTooltip>{volume}</ShortenedTextWithTooltip>
  ) : (
    <Money withSign={withSign ?? true} smallFractionFont={false} tooltipPlacement="bottom">
      {volume}
    </Money>
  )
);
