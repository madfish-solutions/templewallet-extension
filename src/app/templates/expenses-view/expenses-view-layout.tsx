import React, { ReactNode, memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { T, t } from 'lib/i18n';
import { atomsToTokens } from 'lib/temple/helpers';

import InFiat, { InFiatProps } from '../InFiat';
import { ShortenedTextWithTooltip } from '../shortened-text-with-tooltip';

export enum ExpensesViewRowVariant {
  Token = 'Token',
  Collectible = 'Collectibles',
  AllCollectibles = 'AllCollectibles'
}

export interface ExpensesViewRowProps extends Pick<InFiatProps, 'chainId' | 'assetSlug' | 'evm'> {
  icon: ReactNode;
  atomicAmount: BigNumber;
  decimals?: number;
  symbol?: string;
  variant: ExpensesViewRowVariant;
}

interface ExpensesViewLayoutProps {
  title: ReactNode;
  rows: ExpensesViewRowProps[];
}

const ExpensesViewRow = memo<ExpensesViewRowProps>(
  ({ icon, symbol, atomicAmount, decimals, chainId, assetSlug, evm, variant }) => {
    const allCollectibles = variant === ExpensesViewRowVariant.AllCollectibles;
    const isCollectible = variant === ExpensesViewRowVariant.Collectible;
    const volume = useMemo(() => atomsToTokens(atomicAmount, decimals ?? 0), [atomicAmount, decimals]);

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
              <span>{volume.toFixed()}</span>
              <ShortenedTextWithTooltip>{symbol ?? t('unknownToken')}</ShortenedTextWithTooltip>
            </>
          ) : (
            <>
              <ShortenedTextWithTooltip>{volume.toFixed()}</ShortenedTextWithTooltip>
              <span className="whitespace-nowrap">{symbol ?? <T id="unknownToken" />}</span>
            </>
          )}
        </div>
        {!allCollectibles && (
          <span className="text-font-num-12 text-grey-1 ml-3 whitespace-nowrap">
            <InFiat volume={volume} chainId={chainId} assetSlug={assetSlug} evm={evm} withSign>
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

export const ExpensesViewLayout = memo<ExpensesViewLayoutProps>(({ title, rows }) => (
  <div className="bg-white p-4 shadow-bottom rounded-lg flex flex-col gap-3">
    <p className="text-font-description-bold mb-1 text-grey-1">{title}</p>
    <div className="flex flex-col gap-2">
      {rows
        .filter(({ atomicAmount }) => !atomicAmount.isZero())
        .map((props, index) => (
          <ExpensesViewRow key={index} {...props} />
        ))}
    </div>
  </div>
));
