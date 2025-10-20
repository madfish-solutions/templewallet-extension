import React, { ReactNode, memo } from 'react';

import BigNumber from 'bignumber.js';

import { T } from 'lib/i18n';
import { OneOfChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import InFiat from '../InFiat';
import {
  OperationConfirmationCardRowVariant as BalancesChangesViewRowVariant,
  OperationConfirmationCard,
  OperationConfirmationCardRow
} from '../operation-confirmation-card';

interface BalancesChangesViewRowProps {
  assetSlug: string;
  chain: OneOfChains;
  volume: BigNumber;
  symbol?: string;
  variant: BalancesChangesViewRowVariant;
  bridge?: boolean;
}

interface BalancesChangesViewLayoutProps {
  title?: ReactNode;
  rows: BalancesChangesViewRowProps[];
}

interface GroupedBalancesChangesViewLayoutProps {
  rows: BalancesChangesViewRowProps[];
}

const BalancesChangesViewRow = memo<BalancesChangesViewRowProps>(
  ({ chain, symbol, volume, assetSlug, variant, bridge = false }) => {
    const allCollectibles = variant === BalancesChangesViewRowVariant.AllCollectibles;

    return (
      <OperationConfirmationCardRow
        chain={chain}
        assetSlug={assetSlug}
        variant={variant}
        amountClassName={volume.isPositive() ? 'text-success' : undefined}
        volume={volume}
        symbol={symbol}
        bridge={bridge}
        rightContent={
          !allCollectibles && (
            <span className="text-font-num-12 text-grey-1 ml-3 whitespace-nowrap">
              <InFiat
                volume={volume.absoluteValue()}
                chainId={chain.chainId}
                assetSlug={assetSlug}
                evm={chain.kind === TempleChainKind.EVM}
                smallFractionFont={false}
              >
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
          )
        }
      />
    );
  }
);

export const GroupedBalancesChangesViewLayout = ({ rows }: GroupedBalancesChangesViewLayoutProps) => (
  <OperationConfirmationCard title={undefined}>
    {rows.map((props, index) => (
      <React.Fragment key={index}>
        <BalancesChangesViewRow {...props} bridge={true} />
      </React.Fragment>
    ))}
  </OperationConfirmationCard>
);

export const BalancesChangesViewLayout = memo<BalancesChangesViewLayoutProps>(({ title, rows }) => (
  <OperationConfirmationCard title={title}>
    {rows.map((props, index) => (
      <BalancesChangesViewRow key={index} {...props} />
    ))}
  </OperationConfirmationCard>
));
