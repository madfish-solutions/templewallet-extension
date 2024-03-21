import { MouseEventHandler } from 'react';

export enum PartnersPromotionVariant {
  Text = 'Text',
  Image = 'Image'
}

export interface SingleProviderPromotionProps {
  variant: PartnersPromotionVariant;
  isVisible: boolean;
  pageName: string;
  onClose: MouseEventHandler<HTMLButtonElement>;
  onReady: EmptyFn;
  onError: EmptyFn;
  onAdRectSeen: EmptyFn;
}

interface HypelabNativeCreativeSet {
  icon: {
    url: string;
    height: number;
    width: number;
  };
}

interface HypelabBannerCreativeSet {
  image: {
    url: string;
    height: number;
    width: number;
  };
}

export interface HypelabNativeAd {
  cta_url: string;
  campaign_slug: string;
  advertiser: string;
  headline: string;
  body?: string;
  display_url: string;
  cta_text?: string;
  creative_set: HypelabNativeCreativeSet;
}

export interface HypelabBannerAd {
  cta_url: string;
  campaign_slug: string;
  creative_set: HypelabBannerCreativeSet;
}
