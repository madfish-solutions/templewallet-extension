import { useEffect, useRef, useState } from 'react';

import { useRewardsAddresses } from 'app/hooks/use-rewards-addresses';
import { SpecifyAd, SpecifyImageFormat, serveSpecifyAd } from 'lib/apis/specify';
import { useTypedSWR } from 'lib/swr';

export const useSpecifyAd = (
  imageFormat: SpecifyImageFormat,
  adUnitId: string,
  onReady: EmptyFn,
  onError: EmptyFn,
  onImpression: EmptyFn
) => {
  const { evmAddress } = useRewardsAddresses();

  const fetcher = () => (evmAddress ? serveSpecifyAd(evmAddress, imageFormat, adUnitId) : Promise.resolve(null));

  const { data, isLoading, error } = useTypedSWR(evmAddress ? ['specify-ad', adUnitId, evmAddress] : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const ad: SpecifyAd | null = data ?? null;

  useEffect(() => {
    if (!evmAddress || error || (!isLoading && !ad)) {
      onError();
    }
  }, [evmAddress, error, isLoading, ad, onError]);

  useEffect(() => {
    if (ad) {
      onReady();
    }
  }, [ad, onReady]);

  const [adRectVisible, setAdRectVisible] = useState(false);
  const impressionFiredRef = useRef(false);

  useEffect(() => {
    impressionFiredRef.current = false;
  }, [ad?.adId]);

  useEffect(() => {
    if (ad && adRectVisible && !impressionFiredRef.current) {
      impressionFiredRef.current = true;
      onImpression();
    }
  }, [ad, adRectVisible, onImpression]);

  return { ad, onAdRectVisible: setAdRectVisible };
};
