import { getPersonaAdClient, PERSONA_STAGING_ADS_BANNER_UNIT_ID } from 'lib/ads/persona';
import { ADS_VIEWER_DATA_STORAGE_KEY } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';
import type { AdsViewerData } from 'temple/types';

const CONTAINER_ID = 'container';

const usp = new URLSearchParams(window.location.search);
const id = usp.get('id');
const slug = usp.get('slug') ?? PERSONA_STAGING_ADS_BANNER_UNIT_ID;

fetchFromStorage<AdsViewerData>(ADS_VIEWER_DATA_STORAGE_KEY)
  .then(account => getPersonaAdClient(account?.tezosAddress ?? null))
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
    () => {
      const container = document.getElementById(CONTAINER_ID)!;
      const adHref = container.querySelector('a')?.href;
      const adImage = container.querySelector('img');
      const { width, height } = container.children[0]?.getBoundingClientRect() ?? { width: 0, height: 0 };
      const creativeSet = adImage ? { image: { url: adImage.src, width, height } } : undefined;
      postMessage({
        type: 'ready',
        id,
        ad: adHref || creativeSet ? { cta_url: adHref, creative_set: creativeSet } : undefined
      });
    },
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
