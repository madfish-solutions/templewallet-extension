import React, { FC } from 'react';

import { T } from 'lib/i18n/react';
import { useNetwork } from 'lib/temple/front';

import { SwapFormContent } from './SwapFormContent/SwapFormContent';

export const SwapForm: FC = () => {
  const network = useNetwork();

  if (network.type !== 'main') {
    return (
      <p className="text-center text-sm">
        <T id="noExchangersAvailable" />
      </p>
    );
  }

  return <SwapFormContent />;
};
