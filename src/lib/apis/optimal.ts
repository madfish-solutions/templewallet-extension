import axios from 'axios';
import { from } from 'rxjs';

const optimalApi = axios.create({ baseURL: 'https://i.useoptimal.xyz' });

export enum OptimalPromoVariantEnum {
  Fullview = 'tw-fullview',
  Popup = 'tw-popup',
  Mobile = 'tw-mobile',
  Token = 'tw-token'
}

type EmptyPromotion = Record<string, undefined>;
type NormalPromotion = {
  body: string;
  campaign_type: string;
  copy: {
    headline: string;
    cta: string;
    content: string;
  };
  display_type: string;
  div_id: string;
  html: Array<string>;
  id: string;
  image: string;
  link: string;
  nonce: string;
  text: string;
  view_time_url: string;
  view_url: string;
};

export type OptimalPromotionType = EmptyPromotion | NormalPromotion;

export function isEmptyPromotion(promotion: OptimalPromotionType): promotion is EmptyPromotion {
  return !('link' in promotion && 'image' in promotion && 'copy' in promotion);
}

export const getOptimalPromotionImage$ = (variant: OptimalPromoVariantEnum) =>
  from(
    optimalApi
      .get<OptimalPromotionType>('api/v1/decision', {
        params: {
          publisher: 'templewallet', // your-publisher-slug
          ad_types: variant,
          div_ids: 'ad'
        }
      })
      .then(response => {
        const { data } = response;
        assertIsObject(data);

        return data;
      })
  );

function assertIsObject(likelyAnObject: unknown): void {
  const isObject = typeof likelyAnObject === 'object' && likelyAnObject !== null && !Array.isArray(likelyAnObject);

  if (!isObject) {
    throw new Error('Received value is not an object');
  }
}
