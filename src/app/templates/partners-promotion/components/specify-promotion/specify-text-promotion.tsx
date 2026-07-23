import { FC, useState } from 'react';

import { AdsProviderTitle } from 'lib/ads';
import { SpecifyImageFormat } from 'lib/apis/specify';

import { SingleProviderPromotionProps } from '../../types';
import { TextPromotionView } from '../text-promotion-view';

import { useSpecifyAd } from './use-specify-ad';

const dummyImageSrc =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const codePointToString = (code: number) => (code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '');

const decodeHtmlEntities = (text: string) =>
  text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => codePointToString(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => codePointToString(parseInt(dec, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

// Specify `content` may carry HTML entities and a simplified-markdown subset
// (**bold**, *italic*, __underline__, bullets)
const toPlainText = (text: string) =>
  decodeHtmlEntities(text)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^\s*\*\s+/gm, '')
    .replace(/\s*\n+\s*/g, ' ')
    .trim();

export const SpecifyTextPromotion: FC<Omit<SingleProviderPromotionProps, 'variant' | 'blacklistedCampaignSlugs'>> = ({
  accountPkh,
  isVisible,
  pageName,
  onImpression,
  onReady,
  onError
}) => {
  const { ad, onAdRectVisible } = useSpecifyAd(
    SpecifyImageFormat.NO_IMAGE,
    'temple-extension-native',
    onReady,
    onError,
    onImpression
  );

  const [brokenLogoAdId, setBrokenLogoAdId] = useState<string>();
  const handleImageError = () => setBrokenLogoAdId(ad?.adId);

  if (!ad) {
    return null;
  }

  const iconBroken = brokenLogoAdId === ad.adId;
  const iconSrc = !iconBroken && ad.communityLogo ? ad.communityLogo : dummyImageSrc;

  return (
    <TextPromotionView
      accountPkh={accountPkh}
      href={ad.ctaUrl}
      imageSrc={iconSrc}
      isVisible={isVisible}
      headline={ad.headline}
      contentText={toPlainText(ad.content)}
      providerTitle={AdsProviderTitle.Specify}
      pageName={pageName}
      onAdRectVisible={onAdRectVisible}
      onImageError={handleImageError}
    />
  );
};
