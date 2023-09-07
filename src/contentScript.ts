import { TemplePageMessage, TemplePageMessageType } from '@temple-wallet/dapp/dist/types';
import browser from 'webextension-polyfill';

import { IntercomClient } from 'lib/intercom/client';
import { serealizeError } from 'lib/intercom/helpers';
import { TempleMessageType, TempleResponse } from 'lib/temple/types';

import { ContentScriptType } from './lib/constants';
import { checkMatchByUrl } from './lib/utils/check-url';

enum BeaconMessageTarget {
  Page = 'toPage',
  Extension = 'toExtension'
}

enum LegacyPageMessageType {
  Request = 'THANOS_PAGE_REQUEST',
  Response = 'THANOS_PAGE_RESPONSE',
  ErrorResponse = 'THANOS_PAGE_ERROR_RESPONSE'
}

const WEBSITES_ANALYTICS_ENABLED = 'WEBSITES_ANALYTICS_ENABLED';

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

let isUserEnableWebsitesAnalytics = false;
browser.storage.local.get(WEBSITES_ANALYTICS_ENABLED).then(storage => {
  isUserEnableWebsitesAnalytics = storage[WEBSITES_ANALYTICS_ENABLED];
});

const observeUrlChange = () => {
  let oldHref = '';
  const body = document.querySelector('body');

  if (!body) {
    return;
  }

  const observer = new MutationObserver(() => {
    if (oldHref !== document.location.href) {
      oldHref = document.location.href;

      if (checkMatchByUrl(document.location.href)) {
        browser.runtime.sendMessage({ type: ContentScriptType.ExternalLinksActivity, url: document.location.href });
      }
    }
  });

  observer.observe(body, { childList: true, subtree: true });
};

let isContentLoadedBefore = false;

window.onload = () => {
  if (!isContentLoadedBefore && isUserEnableWebsitesAnalytics) {
    isContentLoadedBefore = true;

    observeUrlChange();
  }
};

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
