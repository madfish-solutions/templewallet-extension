import { useEffect, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { getMoonpaySign } from 'lib/apis/temple';
import { getCurrentLocale } from 'lib/i18n';
import { useAccount } from 'lib/temple/front';

const MOONPAY_DOMAIN = 'https://buy.moonpay.com';
const API_KEY = 'pk_live_PrSDks3YtrreqFifd0BsIji7xPXjSGx';
const CURRENCY_CODE = 'xtz';

export const useSignedMoonPayUrl = () => {
  const { publicKeyHash: walletAddress } = useAccount();
  const selectedLocale = getCurrentLocale();
  const defaultUrl = `${MOONPAY_DOMAIN}?apiKey=${API_KEY}&currencyCode=${CURRENCY_CODE}&colorCode=%23ed8936&language=${selectedLocale}`;

  const [signedUrl, setSignedUrl] = useState(defaultUrl);

  useEffect(
    () =>
      void getMoonpaySign(CURRENCY_CODE, '#ed8936', walletAddress, undefined, undefined)
        .then(newSignedUrl => setSignedUrl(newSignedUrl))
        .catch(emptyFn),
    [walletAddress]
  );

  return signedUrl;
};
