import { useEffect, useState } from 'react';

import { getCurrentLocale } from 'lib/i18n';
import { useAccount } from 'lib/temple/front';
import { getMoonpaySign } from 'lib/templewallet-api';

const MOONPAY_DOMAIN = 'https://buy.moonpay.com';
const API_KEY = 'pk_live_PrSDks3YtrreqFifd0BsIji7xPXjSGx';
const CURRENCY_CODE = 'xtz';

export const useSignedMoonPayUrl = () => {
  const { publicKeyHash: walletAddress } = useAccount();
  const selectedLocale = getCurrentLocale();
  const defaultUrl = `${MOONPAY_DOMAIN}?apiKey=${API_KEY}&currencyCode=${CURRENCY_CODE}&colorCode=%23ed8936&language=${selectedLocale}`;

  const [signedUrl, setSignedUrl] = useState(defaultUrl);

  const url = `${defaultUrl}&walletAddress=${walletAddress}`;

  useEffect(
    () =>
      void getMoonpaySign(url)
        .then(response => setSignedUrl(response.data.signedUrl))
        .catch(),
    [url]
  );

  return signedUrl;
};
