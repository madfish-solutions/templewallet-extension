import { getStoredAppInstallIdentity } from 'app/storage/app-install-id';
import { importAdsApiModule } from 'lib/apis/ads-api';
import { signData } from 'lib/utils/ecdsa';
import { RewardsAddresses } from 'temple/types';

export async function performLinkingOfAdsImpressions(adsViewerAddresses: RewardsAddresses) {
  const identity = await getStoredAppInstallIdentity();
  if (!identity) {
    console.warn('App identity not found');
    return;
  }

  const {
    privateKey,
    // Actual installId will be derived by the API
    publicKey: installId
  } = identity;

  const signature = await signData(privateKey, 'LINK_ADS_IMPRESSIONS');

  const { postLinkAdsImpressions } = await importAdsApiModule();

  await postLinkAdsImpressions(adsViewerAddresses, installId, signature);
}
