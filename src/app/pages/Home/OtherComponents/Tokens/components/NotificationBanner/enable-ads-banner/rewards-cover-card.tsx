import React, { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { Money } from 'app/atoms';
import { Lines } from 'app/atoms/Lines';
import { useFiatCurrency } from 'lib/fiat-currency';
import { T } from 'lib/i18n';

interface RewardsCoverCardProps {
  networkLogo: ReactChildren;
  networkName: string;
  costs: BigNumber.Value;
  rewardsCover: ReactChildren;
  annotation?: ReactChildren;
}

export const RewardsCoverCard = memo<RewardsCoverCardProps>(
  ({ networkLogo, networkName, costs, rewardsCover, annotation }) => {
    const { selectedFiatCurrency, fiatRates } = useFiatCurrency();

    const costsInSelectedCurrency = useMemo(
      () => new BigNumber(costs).times(fiatRates.usd).div(fiatRates[selectedFiatCurrency.apiLabel]),
      [costs, fiatRates, selectedFiatCurrency]
    );

    return (
      <div className="flex flex-col p-3 gap-3 rounded-xl border-0.5 border-lines bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {networkLogo}
            <span className="text-font-medium-bold">{networkName}</span>
          </div>
          <div className="flex items-center">
            <span className="text-grey-1 text-font-description">
              <T id="costs" />
            </span>
            <div className="p-1 text-font-num-12">
              <Money fiat smallFractionFont={false} withSign={false} tooltip={false}>
                {costsInSelectedCurrency}
              </Money>{' '}
              {selectedFiatCurrency.symbol}
              <T id="perMonth" />
            </div>
          </div>
        </div>
        <Lines type="line" />
        <div className="flex items-center px-1 justify-between">
          <span className="text-font-description text-grey-1">
            <T id="rewardsCover" />
          </span>
          <div className="flex items-center text-font-num-bold-16 text-success">{rewardsCover}</div>
        </div>
        {annotation}
      </div>
    );
  }
);
