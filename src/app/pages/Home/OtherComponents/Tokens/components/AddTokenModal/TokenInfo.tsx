import React, { memo } from 'react';

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

    <div className="py-2 flex flex-row justify-between items-center border-b-0.5 border-lines">
      <p className="p-1 text-font-description text-grey-1">
        <T id="name" />
      </p>
      <p className="p-1 text-font-description-bold">{name}</p>
    </div>

    <div className="py-2 flex flex-row justify-between items-center border-b-0.5 border-lines">
      <p className="p-1 text-font-description text-grey-1">
        <T id="decimals" />
      </p>
      <p className="p-1 text-font-description-bold">{decimals}</p>
    </div>

    <div className="py-2 flex flex-row justify-between items-center">
      <p className="p-1 text-font-description text-grey-1">
        <T id="symbol" />
      </p>
      <p className="p-1 text-font-description-bold">{symbol}</p>
    </div>
  </div>
));
