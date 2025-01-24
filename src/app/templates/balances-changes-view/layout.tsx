import React, { ReactNode, memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { T, t } from 'lib/i18n';
import { atomsToTokens } from 'lib/temple/helpers';

import InFiat, { InFiatProps } from '../InFiat';
import { ShortenedTextWithTooltip } from '../shortened-text-with-tooltip';

export enum BalancesChangesViewRowVariant {
  Token = 'Token',
  Collectible = 'Collectibles',
  AllCollectibles = 'AllCollectibles'
}

export interface BalancesChangesViewRowProps extends Pick<InFiatProps, 'chainId' | 'assetSlug' | 'evm'> {
  icon: ReactNode;
  atomicAmount: BigNumber;
  decimals?: number;
  symbol?: string;
  variant: BalancesChangesViewRowVariant;
}

interface BalancesChangesViewLayoutProps {
  title: ReactNode;
  rows: BalancesChangesViewRowProps[];
}

const BalancesChangesViewRow = memo<BalancesChangesViewRowProps>(
  ({ icon, symbol, atomicAmount, decimals, chainId, assetSlug, evm, variant }) => {
    const allCollectibles = variant === BalancesChangesViewRowVariant.AllCollectibles;
    const isCollectible = variant === BalancesChangesViewRowVariant.Collectible;
    const volume = useMemo(() => atomsToTokens(atomicAmount, decimals ?? 0), [atomicAmount, decimals]);
    const formattedVolume = useMemo(() => `${volume.isPositive() ? '+' : ''}${volume.toFixed()}`, [volume]);

    return (
      <div className={clsx('flex items-center', allCollectibles ? 'gap-2' : 'gap-1')}>
        {icon}
        <div
          className={clsx(
            'flex flex-1 gap-1 items-center text-font-num-bold-16 min-w-0',
            volume.isPositive() && 'text-success'
          )}
        >
          {isCollectible ? (
            <>
              <span>{formattedVolume}</span>
              <ShortenedTextWithTooltip>{symbol ?? t('unknownToken')}</ShortenedTextWithTooltip>
            </>
          ) : (
            <>
              <ShortenedTextWithTooltip>{formattedVolume}</ShortenedTextWithTooltip>
              <span className="whitespace-nowrap">{symbol ?? <T id="unknownToken" />}</span>
            </>
          )}
        </div>
        {!allCollectibles && (
          <span className="text-font-num-12 text-grey-1 ml-3 whitespace-nowrap">
            <InFiat volume={volume} chainId={chainId} assetSlug={assetSlug} evm={evm}>
              {({ balance, symbol, noPrice }) =>
                noPrice ? (
                  <T id="noValue" />
                ) : (
                  <>
                    {balance} {symbol}
                  </>
                )
              }
            </InFiat>
          </span>
        )}
      </div>
    );
  }
);

export const BalancesChangesViewLayout = memo<BalancesChangesViewLayoutProps>(({ title, rows }) => (
  <div className="bg-white p-4 shadow-bottom rounded-lg flex flex-col gap-3">
    <p className="text-font-description-bold mb-1 text-grey-1">{title}</p>
    <div className="flex flex-col gap-2">
      {rows.map((props, index) => (
        <BalancesChangesViewRow key={index} {...props} />
      ))}
    </div>
  </div>
));
