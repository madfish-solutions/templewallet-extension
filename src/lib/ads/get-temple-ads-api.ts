import memoizee from 'memoizee';

import { configureAds } from 'lib/ads/configure-ads';
import { EnvVars } from 'lib/env';

import { importExtensionAdsModule } from './import-extension-ads-module';

export const getTempleAdsApiInstance = memoizee(async () => {
  const { TempleAdsApi } = await importExtensionAdsModule();
  await configureAds();

  return new TempleAdsApi(EnvVars.TEMPLE_ADS_API_URL);
});
