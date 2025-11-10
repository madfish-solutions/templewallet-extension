import React, { FC, useEffect, useMemo, useRef, useState } from 'react';

import { AES } from 'crypto-js';
import { nanoid } from 'nanoid';

import { useAdTimeout } from 'app/hooks/ads/use-ad-timeout';
import { AdsProviderTitle } from 'lib/ads';
import { HYPELAB_STUB_CAMPAIGN_SLUG } from 'lib/constants';
import { EnvVars } from 'lib/env';
import { useAccountAddressForEvm } from 'temple/front';

import { HypelabBannerAd, SingleProviderPromotionProps } from '../../types';
import { ImagePromotionView } from '../image-promotion-view';

interface AdParams {
  origin: string;
  width: number;
  height: number;
  id: string;
  evmAccountAddress?: string;
  chainName?: string;
}

const adsIframeOrigin = new URL(EnvVars.HYPELAB_ADS_WINDOW_URL).origin;

export const HypelabImagePromotion: FC<Omit<SingleProviderPromotionProps, 'variant'>> = ({
  accountPkh,
  isVisible,
  pageName,
  onAdRectSeen,
  onError,
  onReady
}) => {
  const evmAccountAddress = useAccountAddressForEvm();
  const hypelabIframeRef = useRef<HTMLIFrameElement>(null);
  const [adIsReady, setAdIsReady] = useState(false);
  const [currentAd, setCurrentAd] = useState<HypelabBannerAd | null>(null);
  const [adSize, setAdSize] = useState<{ width: number; height: number }>({ width: 320, height: 100 });
  const prevAdUrlRef = useRef('');
  const { backgroundAssetType, backgroundAssetUrl } = useMemo(() => {
    const creativeSet = currentAd?.creative_set;

    if (!creativeSet) {
      return {};
    }

    if ('image' in creativeSet) {
      return { backgroundAssetType: 'image' as const, backgroundAssetUrl: creativeSet.image.url };
    }

    return { backgroundAssetType: 'video' as const, backgroundAssetUrl: creativeSet.video.url };
  }, [currentAd]);

  useAdTimeout(adIsReady, onError);

  const adId = useMemo(() => nanoid(), []);
  useEffect(() => {
    if (!hypelabIframeRef.current) {
      return;
    }

    const messagesListener = (event: MessageEvent) => {
      if (event.origin !== adsIframeOrigin) {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (data.id !== adId) return;

        switch (data.type) {
          case 'ready':
            const ad: HypelabBannerAd | undefined = data?.ad;

            if (!ad) {
              return;
            }

            if (ad && prevAdUrlRef.current !== ad.cta_url && ad.campaign_slug === HYPELAB_STUB_CAMPAIGN_SLUG) {
              onError();
            } else if (ad && prevAdUrlRef.current !== ad.cta_url) {
              setCurrentAd(ad);
              prevAdUrlRef.current = ad.cta_url;
              setAdIsReady(true);
              onReady();
            }
            break;
          case 'error':
            onError();
            break;
          case 'resize':
            if (data.width !== 0 && data.height !== 0) {
              setAdSize({ width: data.width, height: data.height });
            }
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('message', messagesListener);

    return () => window.removeEventListener('message', messagesListener);
  }, [adId, onError, onReady]);

  const iframeSrc = useMemo(
    () => getAdsTwUrl({ origin: globalThis.location.origin, width: 320, height: 100, id: adId, evmAccountAddress }),
    [adId, evmAccountAddress]
  );

  return (
    <ImagePromotionView
      accountPkh={accountPkh}
      href={currentAd?.cta_url ?? '#'}
      isVisible={isVisible}
      providerTitle={AdsProviderTitle.HypeLab}
      pageName={pageName}
      onAdRectSeen={onAdRectSeen}
      backgroundAssetUrl={backgroundAssetUrl}
      backgroundAssetType={backgroundAssetType}
    >
      <div>
        <iframe
          title="Ad"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="block border-none rounded overflow-hidden"
          style={adSize}
          src={iframeSrc}
          ref={hypelabIframeRef}
        />
      </div>
    </ImagePromotionView>
  );
};

const plainSearchParamsKeys: Record<string, string> = {
  width: 'w',
  height: 'h',
  slug: 'p',
  id: 'id',
  evmAccountAddress: 'ea',
  chainName: 'cn'
};

const encryptWithAES = (text: string) => AES.encrypt(text, EnvVars.TEMPLE_ADS_ORIGIN_PASSPHRASE).toString();

const getAdsTwUrl = ({ origin, ...restParams }: AdParams) => {
  const url = new URL(EnvVars.HYPELAB_ADS_WINDOW_URL);

  const setUrlSearchParam = (key: string, value: string | number) => {
    url.searchParams.set(key, String(value));
  };

  setUrlSearchParam('ps', EnvVars.HYPELAB_PROPERTY_SLUG);

  setUrlSearchParam('ap', 'hypelab');

  Object.entries({ slug: EnvVars.HYPELAB_INTERNAL_MEDIUM_PLACEMENT_SLUG, ...restParams }).forEach(([key, value]) => {
    if (value || value === 0) {
      setUrlSearchParam(plainSearchParamsKeys[key], value);
    }
  });

  setUrlSearchParam('o', encryptWithAES(origin));

  return url.toString();
};
