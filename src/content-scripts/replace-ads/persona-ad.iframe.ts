import { getPersonaAdClient, PERSONA_STAGING_ADS_BANNER_UNIT_ID } from 'lib/ads/persona';
import { EnvVars } from 'lib/env';

import type { PersonaAdShape } from './ads-meta';

const CONTAINER_ID = 'container';

const usp = new URLSearchParams(window.location.search);
const id = usp.get('id');
const shape = usp.get('shape');

getPersonaAdClient()
  .then(({ client, environment }) => {
    const adUnitId = getUnitId(shape as PersonaAdShape, environment === 'staging');

    return client.showBannerAd(
      // @ts-expect-error // for missung `adConfig` prop
      { adUnitId, containerId: CONTAINER_ID },
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

const getUnitId = (shape: PersonaAdShape, isStaging: boolean) => {
  if (isStaging)
    switch (shape) {
      case 'wide':
        return '3a094192-4c7b-4761-a50c-bd9b6a67e987';
      case 'medium':
        return 'cf20c750-2fe4-4761-861f-b73b2247fd4d';
      case 'squarish':
        return 'bf498e26-eb16-4e35-8954-e65690f28819';
      default:
        return PERSONA_STAGING_ADS_BANNER_UNIT_ID;
    }

  switch (shape) {
    case 'wide':
      return EnvVars.PERSONA_ADS_WIDE_BANNER_UNIT_ID;
    case 'medium':
      return EnvVars.PERSONA_ADS_MEDIUM_BANNER_UNIT_ID;
    case 'squarish':
      return EnvVars.PERSONA_ADS_SQUARISH_BANNER_UNIT_ID;
    default:
      return EnvVars.PERSONA_ADS_BANNER_UNIT_ID;
  }
};
