import { renderAdsStack } from '@temple-wallet/extension-ads';

import { configureAds } from 'lib/ads/configure-ads';
import { ADS_META_SEARCH_PARAM_NAME, ORIGIN_SEARCH_PARAM_NAME } from 'lib/constants';

const usp = new URLSearchParams(window.location.search);
const id = usp.get('id');
const origin = usp.get(ORIGIN_SEARCH_PARAM_NAME) ?? window.location.href;
const adsMetadataIds = usp.getAll(ADS_META_SEARCH_PARAM_NAME).map(value => JSON.parse(value));

configureAds()
  .then(() => renderAdsStack(id ?? '', adsMetadataIds, origin))
  .catch(console.error);
