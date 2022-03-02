import { useEffect, useState } from 'react';

import makeBuildQueryFn from '../../../../lib/makeBuildQueryFn';

const buildQuery = makeBuildQueryFn<Record<string, string>, any>('https://api.templewallet.com/api');

const getSignedMoonPayUrl = buildQuery('GET', '/moonpay-sign', ['url']);

export const useSignedMoonPayUrl = (url: string) => {
  const [signedUrl, setSignedUrl] = useState('');

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
