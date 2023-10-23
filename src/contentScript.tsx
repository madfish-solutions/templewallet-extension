import React from 'react';

import { TemplePageMessage, TemplePageMessageType } from '@temple-wallet/dapp/dist/types';
import debounce from 'debounce';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';

import { ContentScriptType } from 'lib/constants';
import { IntercomClient } from 'lib/intercom/client';
import { serealizeError } from 'lib/intercom/helpers';
import { ADS_REPLACE_URLS_BASES } from 'lib/slise/constants';
import { getAdsContainers } from 'lib/slise/get-ads-containers';
import { getSlotId } from 'lib/slise/get-slot-id';
import { SliseAd } from 'lib/slise/slise-ad';
import { TempleMessageType, TempleResponse } from 'lib/temple/types';

const WEBSITES_ANALYTICS_ENABLED = 'WEBSITES_ANALYTICS_ENABLED';
const TRACK_URL_CHANGE_INTERVAL = 5000;

enum BeaconMessageTarget {
  Page = 'toPage',
  Extension = 'toExtension'
}

enum LegacyPageMessageType {
  Request = 'THANOS_PAGE_REQUEST',
  Response = 'THANOS_PAGE_RESPONSE',
  ErrorResponse = 'THANOS_PAGE_ERROR_RESPONSE'
}

interface LegacyPageMessage {
  type: LegacyPageMessageType;
  payload: any;
  reqId?: string | number;
}

type BeaconMessage =
  | {
      target: BeaconMessageTarget;
      payload: any;
    }
  | {
      target: BeaconMessageTarget;
      encryptedPayload: any;
    };
type BeaconPageMessage = BeaconMessage | { message: BeaconMessage; sender: { id: string } };

const availableAdsResolutions = [
  { width: 270, height: 90 },
  { width: 728, height: 90 }
];

const replaceAds = debounce(
  () => {
    if (!ADS_REPLACE_URLS_BASES.some(base => window.location.href.startsWith(base))) {
      return;
    }

    try {
      const adsContainers = getAdsContainers();

      adsContainers.forEach(({ element: adContainer, width: containerWidth }) => {
        let adsResolution = availableAdsResolutions[0];
        for (let i = 1; i < availableAdsResolutions.length; i++) {
          const candidate = availableAdsResolutions[i];
          if (candidate.width <= containerWidth && candidate.width > adsResolution.width) {
            adsResolution = candidate;
          }
        }

        const adRoot = createRoot(adContainer);
        adRoot.render(
          <SliseAd slotId={getSlotId()} pub="pub-25" width={adsResolution.width} height={adsResolution.height} />
        );
      });
    } catch {}
  },
  100,
  true
);

// Prevents the script from running in an Iframe
if (window.frameElement === null) {
  browser.storage.local.get(WEBSITES_ANALYTICS_ENABLED).then(storage => {
    if (storage[WEBSITES_ANALYTICS_ENABLED]) {
      let oldHref = '';

      const trackUrlChange = () => {
        if (oldHref !== window.parent.location.href) {
          oldHref = window.parent.location.href;

          browser.runtime.sendMessage({
            type: ContentScriptType.ExternalLinksActivity,
            url: window.parent.location.href
          });
        }
      };

      trackUrlChange();

      // Track url changes without page reload
      setInterval(trackUrlChange, TRACK_URL_CHANGE_INTERVAL);

      // Replace ads with those from Slise
      window.addEventListener('load', () => replaceAds());
      window.addEventListener('ready', () => replaceAds());
      setInterval(() => replaceAds(), 1000);
    }
  });
}

const SENDER = {
  id: browser.runtime.id,
  name: 'Temple - Tezos Wallet',
  iconUrl: 'https://templewallet.com/logo.png'
};

window.addEventListener(
  'message',
  evt => {
    if (evt.source !== window) return;

    const legacyRequest = evt.data?.type === LegacyPageMessageType.Request;
    const isTempleRequest = evt.data?.type === TemplePageMessageType.Request || legacyRequest;
    const isBeaconRequest =
      evt.data?.target === BeaconMessageTarget.Extension && (evt.data?.targetId === SENDER.id || !evt.data?.targetId);

    if (isTempleRequest) {
      templeRequest(evt, legacyRequest);
    } else if (isBeaconRequest) {
      beaconRequest(evt);
    } else {
      return;
    }
  },
  false
);

function templeRequest(evt: MessageEvent, isLegacyRequest: boolean) {
  const { payload, reqId } = evt.data as TemplePageMessage;

  getIntercom()
    .request({
      type: TempleMessageType.PageRequest,
      origin: evt.origin,
      payload
    })
    .then((res: TempleResponse) => {
      if (res?.type === TempleMessageType.PageResponse) {
        send(
          {
            type: isLegacyRequest ? LegacyPageMessageType.Response : TemplePageMessageType.Response,
            payload: res.payload,
            reqId
          },
          evt.origin
        );
      }
    })
    .catch(err => {
      send(
        {
          type: isLegacyRequest ? LegacyPageMessageType.ErrorResponse : TemplePageMessageType.ErrorResponse,
          payload: serealizeError(err),
          reqId
        },
        evt.origin
      );
    });
}

function beaconRequest(evt: MessageEvent) {
  const { origin, data } = evt;
  const encrypted = Boolean(data.encryptedPayload);
  getIntercom()
    .request({
      type: TempleMessageType.PageRequest,
      origin: origin,
      payload: data.encryptedPayload ?? data.payload,
      beacon: true,
      encrypted: Boolean(data.encryptedPayload)
    })
    .then((res: TempleResponse) => {
      if (res?.type === TempleMessageType.PageResponse && res.payload) {
        const message = {
          target: BeaconMessageTarget.Page,
          ...(res.encrypted ? { encryptedPayload: res.payload } : { payload: res.payload })
        };
        send(
          res.payload === 'pong'
            ? { ...message, sender: SENDER }
            : {
                message,
                sender: { id: SENDER.id }
              },
          origin
        );
      }
    })
    .catch(err => console.error(err));

  getIntercom()
    .request({
      type: TempleMessageType.Acknowledge,
      origin: origin,
      payload: data.encryptedPayload ?? data.payload,
      beacon: true,
      encrypted: encrypted
    })
    .then((res: TempleResponse) => {
      if (res?.type === TempleMessageType.Acknowledge) {
        const acknowledgeMessage = {
          target: BeaconMessageTarget.Page,
          ...(res.encrypted ? { encryptedPayload: res.payload } : { payload: res.payload })
        };
        send(
          {
            message: acknowledgeMessage,
            sender: { id: SENDER.id }
          },
          origin
        );
      }
    })
    .catch(err => console.error(err));
}

function send(msg: TemplePageMessage | LegacyPageMessage | BeaconPageMessage, targetOrigin: string) {
  if (!targetOrigin || targetOrigin === '*') return;
  window.postMessage(msg, targetOrigin);
}

let intercom: IntercomClient;
function getIntercom() {
  if (!intercom) {
    intercom = new IntercomClient();
  }
  return intercom;
}
