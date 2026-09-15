import { FC } from 'react';

import { AdsProviderTitle } from 'lib/ads';
import { SpecifyImageFormat } from 'lib/apis/specify';

import { SingleProviderPromotionProps } from '../../types';
import { ImagePromotionView } from '../image-promotion-view';

import { useSpecifyAd } from './use-specify-ad';

export const SpecifyImagePromotion: FC<Omit<SingleProviderPromotionProps, 'variant' | 'blacklistedCampaignSlugs'>> = ({
  accountPkh,
  isVisible,
  pageName,
  onImpression,
  onReady,
  onError
}) => {
  const { ad, onAdRectVisible } = useSpecifyAd(
    SpecifyImageFormat.SHORT_BANNER,
    'temple-extension-banner-320x100',
    onReady,
    onError,
    onImpression
  );

  if (!ad || !ad.imageUrl) {
    return null;
  }

  return (
    <ImagePromotionView
      accountPkh={accountPkh}
      href={ad.ctaUrl}
      isVisible={isVisible}
      providerTitle={AdsProviderTitle.Specify}
      pageName={pageName}
      backgroundAssetUrl={ad.imageUrl}
      backgroundAssetType="image"
      onAdRectVisible={onAdRectVisible}
    >
      <img className="w-80 h-[100px] rounded object-cover" src={ad.imageUrl} alt="" onError={onError} />
    </ImagePromotionView>
  );
};
