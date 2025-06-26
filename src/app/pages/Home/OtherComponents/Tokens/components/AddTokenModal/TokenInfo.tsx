import React, { memo } from 'react';

import { PlainChartListItem } from 'app/templates/chart-list-item';
import { T } from 'lib/i18n';

interface TokenInfoProps {
  name?: string;
  decimals?: number;
  symbol?: string;
}

export const TokenInfo = memo<TokenInfoProps>(({ name, decimals, symbol }) => (
  <div className="flex flex-col px-4 pt-4 pb-2 mb-6 rounded-lg shadow-bottom border-0.5 border-transparent">
    <p className="p-1 text-font-description-bold text-grey-2">
      <T id="tokenInfo" />
    </p>

    <PlainChartListItem title={<T id="name" />}>{name}</PlainChartListItem>
    <PlainChartListItem title={<T id="decimals" />}>{decimals}</PlainChartListItem>
    <PlainChartListItem title={<T id="symbol" />} bottomSeparator={false}>
      {symbol}
    </PlainChartListItem>
  </div>
));
