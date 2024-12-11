import React, { memo } from 'react';

import clsx from 'clsx';

import { T } from 'lib/i18n';

import { CurrencyIcon } from '../../../components/CurrencyIcon';
import { useExchangeDataState } from '../../../context';

interface Props {
  className?: string;
}

export const ExpiresInBlock = memo<Props>(({ className }) => {
  const { exchangeData } = useExchangeDataState();

  if (!exchangeData) return null;

  return (
    <div className={clsx('p-0.5 rounded-lg shadow-bottom border-0.5 border-transparent', className)}>
      <div className="flex flex-row justify-between bg-grey-4 rounded-l-7 rounded-r-7">
        <span className="text-font-description-bold text-grey-1">
          <T id="expiresIn" />
        </span>
        <span className="text-font-num-bold-12">44:30</span>
      </div>
      <div className="flex flex-col justify-center items-center gap-y-2">
        <div className="flex flex-row gap-x-2">
          <CurrencyIcon src={exchangeData.coinFrom.icon} code={exchangeData.coinFrom.coinCode} size={24} />
          <span className="text-font-num-bold-16">{`${exchangeData.amount} ${exchangeData.coinFrom.coinCode}`}</span>
        </div>
        <span className="text-font-description">
          <T
            id="sendInOneTransaction"
            substitutions={[
              <span key="networkName" className="text-font-description-bold">
                {exchangeData.coinFrom.networkName}
              </span>
            ]}
          />
        </span>
      </div>
    </div>
  );
});
