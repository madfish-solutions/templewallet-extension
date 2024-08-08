import { getPersonaAdClient, PERSONA_STAGING_ADS_BANNER_UNIT_ID } from 'lib/ads/persona';
import { ADS_VIEWER_ADDRESS_STORAGE_KEY } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

const CONTAINER_ID = 'container';

const usp = new URLSearchParams(window.location.search);
const id = usp.get('id');
const slug = usp.get('slug') ?? PERSONA_STAGING_ADS_BANNER_UNIT_ID;

fetchFromStorage<string>(ADS_VIEWER_ADDRESS_STORAGE_KEY)
  .then(accountPkhFromStorage => getPersonaAdClient(accountPkhFromStorage))
  .then(({ client }) => {
    return client.showBannerAd(
      // @ts-expect-error // for missung `adConfig` prop
      { adUnitId: slug, containerId: CONTAINER_ID },
      errorMsg => {
        throw new Error(String(errorMsg));
      }
    );
  })
  .then(
    () => void postMessage({ type: 'ready' }),
    error => {
      console.error(error);
      postMessage({ type: 'error', reason: String(error) });
    }
  );

const postMessage = (message: object) =>
  window.parent.postMessage(
    JSON.stringify({ ...message, id }),
    '*' // This is required
  );
