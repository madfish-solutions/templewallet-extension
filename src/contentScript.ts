import { browser } from "webextension-polyfill-ts";
import { IntercomClient } from "lib/intercom/client";
import { ThanosMessageType, ThanosResponse } from "lib/thanos/types";
import {
  ThanosPageMessage,
  ThanosPageMessageType,
} from "@thanos-wallet/dapp/dist/types";

enum BeaconMessageTarget {
  Page = "toPage",
  Extension = "toExtension",
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

type BeaconPageMessage =
  | BeaconMessage
  | { message: BeaconMessage; sender: { id: string } };

const SENDER = {
  id: browser.runtime.id,
  name: "Thanos Wallet",
  iconUrl: process.env.THANOS_WALLET_LOGO_URL || undefined,
};

window.addEventListener(
  "message",
  (evt) => {
    if (evt.source !== window) return;

    if (evt.data?.type === ThanosPageMessageType.Request) {
      const { payload, reqId } = evt.data as ThanosPageMessage;

      getIntercom()
        .request({
          type: ThanosMessageType.PageRequest,
          origin: evt.origin,
          payload,
        })
        .then((res: ThanosResponse) => {
          if (res?.type === ThanosMessageType.PageResponse) {
            send(
              {
                type: ThanosPageMessageType.Response,
                payload: res.payload,
                reqId,
              },
              evt.origin
            );
          }
        })
        .catch((err) => {
          send(
            {
              type: ThanosPageMessageType.ErrorResponse,
              payload: err.message,
              reqId,
            },
            evt.origin
          );
        });
    } else if (
      evt.data?.target === BeaconMessageTarget.Extension &&
      (evt.data?.targetId === SENDER.id || !evt.data?.targetId)
    ) {
      getIntercom()
        .request({
          type: ThanosMessageType.PageRequest,
          origin: evt.origin,
          payload: evt.data.encryptedPayload ?? evt.data.payload,
          beacon: true,
          encrypted: Boolean(evt.data.encryptedPayload),
        })
        .then((res: ThanosResponse) => {
          if (res?.type === ThanosMessageType.PageResponse && res.payload) {
            const message = {
              target: BeaconMessageTarget.Page,
              ...(res.encrypted
                ? { encryptedPayload: res.payload }
                : { payload: res.payload }),
            };
            send(
              res.payload === "pong"
                ? { ...message, sender: SENDER }
                : {
                    message,
                    sender: { id: SENDER.id },
                  },
              evt.origin
            );
          }
        })
        .catch((err) => console.error(err));
    }
  },
  false
);

function send(msg: ThanosPageMessage | BeaconPageMessage, targetOrigin = "*") {
  window.postMessage(msg, targetOrigin);
}

let intercom: IntercomClient;
function getIntercom() {
  if (!intercom) {
    intercom = new IntercomClient();
  }
  return intercom;
}
