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

interface HypelabImageCreativeSet {
  image: {
    url: string;
    height: number;
    width: number;
  };
}

interface HypelabVideoCreativeSet {
  video: {
    url: string;
    height: number;
    width: number;
  };
}

type HypelabBannerCreativeSet = HypelabImageCreativeSet | HypelabVideoCreativeSet;

export interface HypelabBannerAd {
  cta_url: string;
  campaign_slug: string;
  creative_set: HypelabBannerCreativeSet;
}
