import { useEffect, useState } from 'react';

import { getCurrentLocale } from '../../../../lib/i18n';
import makeBuildQueryFn from '../../../../lib/makeBuildQueryFn';
import { useAccount } from '../../../../lib/temple/front';

const MOONPAY_DOMAIN = 'https://buy-sandbox.moonpay.com';
const API_KEY = 'pk_test_qO0hEwo5BlcLCGBUsDwARc4PSW80bmR';
const CURRENCY_CODE = 'xtz';

const buildQuery = makeBuildQueryFn<Record<string, string>, any>('https://api.templewallet.com/api');

const getSignedMoonPayUrl = buildQuery('GET', '/moonpay-sign', ['url']);

export const useSignedMoonPayUrl = () => {
  const [signedUrl, setSignedUrl] = useState('');
  const isDisabled = signedUrl === '';

  const { publicKeyHash: walletAddress } = useAccount();
  const selectedLocale = getCurrentLocale();

  const url = `${MOONPAY_DOMAIN}?apiKey=${API_KEY}&currencyCode=${CURRENCY_CODE}&walletAddress=${walletAddress}&colorCode=%23ed8936&language=${selectedLocale}`;

  useEffect(() => {
    (async () => {
      try {
        const response = await getSignedMoonPayUrl({ url });
        setSignedUrl(response.signedUrl);
      } catch {}
    })();
  }, [url]);

  return { signedUrl, isDisabled };
};
