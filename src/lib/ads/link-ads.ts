import { InMemorySigner } from '@taquito/signer';

import { getStoredAppInstallIdentity } from 'app/storage/app-install-id';
import { postLinkAdsImpressions } from 'lib/apis/ads-api';
import { stringToHex } from 'lib/utils';

export async function performLinkingOfAdsImpressions(accountPkh: string) {
  const identity = await getStoredAppInstallIdentity();
  if (!identity) throw new Error('App identity not found');

  const {
    privateKey,
    // Actual installId will be derived by the API
    publicKey: installId
  } = identity;

  const signer = new InMemorySigner(privateKey);

  const msgBytes = stringToHex('LINK_ADS_IMPRESSIONS');

  const signature = (await signer.sign(msgBytes)).sig;

  await postLinkAdsImpressions(accountPkh, installId, signature);
}
