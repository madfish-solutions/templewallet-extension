import { getStoredAppInstallIdentity } from 'app/storage/app-install-id';
import { postLinkAdsImpressions } from 'lib/apis/ads-api';
import { signData } from 'lib/utils/ecdsa';

export async function performLinkingOfAdsImpressions(accountPkh: string) {
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

  await postLinkAdsImpressions(accountPkh, installId, signature);
}
