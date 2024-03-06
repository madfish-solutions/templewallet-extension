import { nanoid } from 'nanoid';

import { TEMPLE_WALLET_AD_ATTRIBUTE_NAME } from 'lib/constants';
import { EnvVars } from 'lib/env';

import { AdDimensions, PersonaAdShape } from '../ads-meta';
import { getPersonaAdClient } from '../persona';

import { AdView } from './types';

export const makePersonaAdView = async (
  shape: PersonaAdShape,
  { width }: AdDimensions,
  elementStyle: StringRecord
): Promise<AdView> => {
  const containerId = nanoid();

  const element = document.createElement('div');
  element.id = containerId;
  element.style.width = `${width}px`;
  element.setAttribute(TEMPLE_WALLET_AD_ATTRIBUTE_NAME, 'true');
  for (const styleProp in elementStyle) {
    element.style.setProperty(styleProp, elementStyle[styleProp]);
  }

  const styleElem = document.createElement('style');
  styleElem.innerText = `
    #${containerId} > div {
      /* To have control over image's size */
      height: unset !important;
      max-height: 100% !important;
      width: unset !important;
      max-width: 100% !important;
      margin: auto;
      align-items: stretch !important;
    }
  `;
  document.head.appendChild(styleElem);

  const { client, environment } = await getPersonaAdClient();

  const adUnitId = getUnitId(shape, environment === 'staging');

  const postAppend = async () => {
    await client.showBannerAd(
      // @ts-expect-error // for missung `adConfig` prop
      { adUnitId, containerId },
      errorMsg => {
        throw new Error(String(errorMsg));
      }
    );
  };

  return { element, postAppend };
};

const getUnitId = (shape: PersonaAdShape, isStaging: boolean) => {
  if (isStaging)
    switch (shape) {
      case 'wide':
        return '3a094192-4c7b-4761-a50c-bd9b6a67e987';
      case 'squarish':
        return 'bf498e26-eb16-4e35-8954-e65690f28819';
      default:
        return 'cf20c750-2fe4-4761-861f-b73b2247fd4d';
    }

  switch (shape) {
    case 'wide':
      return EnvVars.PERSONA_ADS_WIDE_BANNER_UNIT_ID;
    case 'squarish':
      return EnvVars.PERSONA_ADS_SQUARISH_BANNER_UNIT_ID;
    default:
      return EnvVars.PERSONA_ADS_BANNER_UNIT_ID;
  }
};
