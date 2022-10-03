import { useEffect, useState } from 'react';

import { getCurrentLocale } from 'lib/i18n';
import { useAccount } from 'lib/temple/front';
import { templewalletQuery } from 'lib/templewallet-api/templewallet-query';

const MOONPAY_DOMAIN = 'https://buy.moonpay.com';
const API_KEY = 'pk_live_PrSDks3YtrreqFifd0BsIji7xPXjSGx';
const CURRENCY_CODE = 'xtz';

const getSignedMoonPayUrl = templewalletQuery('GET', '/moonpay-sign', ['url']);

export const useSignedMoonPayUrl = () => {
  const { publicKeyHash: walletAddress } = useAccount();
  const selectedLocale = getCurrentLocale();
  const defaultUrl = `${MOONPAY_DOMAIN}?apiKey=${API_KEY}&currencyCode=${CURRENCY_CODE}&colorCode=%23ed8936&language=${selectedLocale}`;

  const [signedUrl, setSignedUrl] = useState(defaultUrl);

  const url = `${defaultUrl}&walletAddress=${walletAddress}`;

  useEffect(() => {
    (async () => {
      try {
        const response = await getSignedMoonPayUrl({ url });
        setSignedUrl(response.signedUrl);
      } catch {}
    })();
  }, [url]);

  return signedUrl;
};
