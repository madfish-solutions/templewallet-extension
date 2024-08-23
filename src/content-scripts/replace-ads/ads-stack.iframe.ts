import { configureAds } from 'lib/ads/configure-ads';
import { importExtensionAdsModule } from 'lib/ads/import-extension-ads-module';
import { ADS_META_SEARCH_PARAM_NAME, ORIGIN_SEARCH_PARAM_NAME } from 'lib/constants';

const usp = new URLSearchParams(window.location.search);
const id = usp.get('id');
const origin = usp.get(ORIGIN_SEARCH_PARAM_NAME) ?? window.location.href;
const adsMetadataIds = usp.getAll(ADS_META_SEARCH_PARAM_NAME).map(value => JSON.parse(value));

if (adsMetadataIds.every(id => typeof id === 'number')) {
  document.body.style.backgroundColor = '#F2F2F2';
}

configureAds()
  .then(() => importExtensionAdsModule())
  .then(({ renderAdsStack }) => renderAdsStack(id ?? '', adsMetadataIds, origin))
  .catch(error => console.error(error));
