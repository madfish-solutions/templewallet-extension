import React from 'react';

import { getCurrentLocale } from 'lib/i18n';
import { useAccount } from 'lib/temple/front';

export const MoonPay = () => {
  const { publicKeyHash: walletAddress } = useAccount();
  const selectedLocale = getCurrentLocale();
  console.log(selectedLocale);

  return (
    <a
      href={`https://buy-sandbox.moonpay.com?apiKey=pk_test_qO0hEwo5BlcLCGBUsDwARc4PSW80bmR&currencyCode=xtz&walletAddress=${walletAddress}&colorCode=%23ed8936&language=${selectedLocale}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      asf
    </a>
  );
};
