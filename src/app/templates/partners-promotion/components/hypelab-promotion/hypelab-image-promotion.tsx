import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AES } from 'crypto-js';
import { nanoid } from 'nanoid';

import { AdsProviderTitle } from 'lib/ads';
import { EnvVars } from 'lib/env';
import { useTimeout, useUpdatableRef } from 'lib/ui/hooks';
import { useAccountAddressForEvm } from 'temple/front';

import { HypelabBannerAd, HypelabPromotionProps } from '../../types';
import { ImagePromotionView } from '../image-promotion-view';

interface AdParams {
  origin: string;
  width: number;
  height: number;
  id: string;
  evmAccountAddress?: string;
  chainName?: string;
}

const AD_LOADING_TIMEOUT = 3_000;

export const HypelabImagePromotion: FC<Omit<HypelabPromotionProps, 'variant'>> = ({
  accountPkh,
  isVisible,
  pageName,
  blacklistedCampaignSlugs,
  unpaidCampaignSlugs,
  onImpression,
  onError,
  onReady,
  onNoPaidAd,
  showNonPaidAd
}) => {
  const evmAccountAddress = useAccountAddressForEvm();
  const hypelabIframeRef = useRef<HTMLIFrameElement>(null);
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

  const [adRectVisible, setAdRectVisible] = useState(false);
  const adRectVisibleRef = useUpdatableRef(adRectVisible);

  const adId = useMemo(() => nanoid(), []);

  const isBlacklistedAd = useCallback(
    (ad: HypelabBannerAd | nullish) => blacklistedCampaignSlugs?.includes(ad?.campaign_slug ?? '') ?? false,
    [blacklistedCampaignSlugs]
  );

  const isUnpaidAd = useCallback(
    (ad: HypelabBannerAd | nullish) => unpaidCampaignSlugs?.includes(ad?.campaign_slug ?? '') ?? false,
    [unpaidCampaignSlugs]
  );

  // Blacklisted ads are never shown (suppressed), unpaid ads show only as the last-resort fallback
  const isDisplayableAd = useCallback(
    (ad: HypelabBannerAd | nullish) => !isBlacklistedAd(ad) && (!isUnpaidAd(ad) || showNonPaidAd),
    [isBlacklistedAd, isUnpaidAd, showNonPaidAd]
  );

  useTimeout(() => {
    if (!currentAd) {
      onError();
    }
  }, AD_LOADING_TIMEOUT);

  useEffect(() => {
    if (!hypelabIframeRef.current) {
      return;
    }

    const handleReadyAd = (data: any) => {
      const ad: HypelabBannerAd | undefined = data?.ad;

      if (!ad) {
        return;
      }

      if (ad && prevAdUrlRef.current !== ad.cta_url) {
        setCurrentAd(ad);
        prevAdUrlRef.current = ad.cta_url;
        if (isDisplayableAd(ad)) {
          onReady();
        } else {
          onNoPaidAd();
        }
      }
    };

    const messagesListener = (event: MessageEvent) => {
      if (!event.source || event.source !== hypelabIframeRef.current?.contentWindow) {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (data.id !== adId) return;

        switch (data.type) {
          case 'ready':
            handleReadyAd(data);
            break;
          case 'error':
            console.error('Error from Hypelab', data);
            onError();
            break;
          case 'resize':
            if (data.width !== 0 && data.height !== 0) {
              setAdSize({ width: data.width, height: data.height });
            }
            break;
          case 'impression':
            if (adRectVisibleRef.current && isDisplayableAd(currentAd)) {
              onImpression();
            }
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('message', messagesListener);

    return () => window.removeEventListener('message', messagesListener);
  }, [adId, onError, onReady, onNoPaidAd, onImpression, adRectVisibleRef, isDisplayableAd, currentAd]);

  const iframeSrc = useMemo(
    () => getAdsTwUrl({ origin: globalThis.location.origin, width: 320, height: 100, id: adId, evmAccountAddress }),
    [adId, evmAccountAddress]
  );

  return (
    <ImagePromotionView
      accountPkh={accountPkh}
      href={currentAd?.cta_url ?? '#'}
      isVisible={isVisible && isDisplayableAd(currentAd)}
      providerTitle={AdsProviderTitle.HypeLab}
      pageName={pageName}
      backgroundAssetUrl={backgroundAssetUrl}
      backgroundAssetType={backgroundAssetType}
      onAdRectVisible={setAdRectVisible}
    >
      <div>
        <iframe
          title="Ad"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="block border-none rounded overflow-hidden"
          style={adSize}
          src={iframeSrc}
          ref={hypelabIframeRef}
          onError={onError}
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
