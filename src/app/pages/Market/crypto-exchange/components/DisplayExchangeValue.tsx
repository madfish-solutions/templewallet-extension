import React, { memo, useMemo } from 'react';

import Money from 'app/atoms/Money';

import { EXOLIX_DECIMALS } from '../config';
import { getCurrencyDisplayCode } from '../utils';

interface Props {
  value: string | number;
  currencyCode: string;
  showAllDecimals?: boolean;
}

export const DisplayExchangeValue = memo<Props>(({ value, currencyCode, showAllDecimals = false }) => {
  const decimals = useMemo(
    () => (showAllDecimals ? EXOLIX_DECIMALS : String(value).length > 10 ? 2 : EXOLIX_DECIMALS),
    [value, showAllDecimals]
  );

  return (
    <>
      <Money cryptoDecimals={decimals} smallFractionFont={false} tooltipPlacement="bottom">
        {value}
      </Money>{' '}
      {getCurrencyDisplayCode(currencyCode)}
    </>
  );
});
