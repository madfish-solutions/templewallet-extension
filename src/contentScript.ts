import { browser } from "webextension-polyfill-ts";
import { IntercomClient } from "lib/intercom/client";
import { serealizeError } from "lib/intercom/helpers";
import { TempleMessageType, TempleResponse } from "lib/temple/types";
import {
  TemplePageMessage,
  TemplePageMessageType,
} from "@temple-wallet/dapp/dist/types";

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
  name: "Temple Wallet",
  iconUrl: process.env.TEMPLE_WALLET_LOGO_URL || undefined,
};

window.addEventListener(
  "message",
  (evt) => {
    if (evt.source !== window) return;

    if (evt.data?.type === TemplePageMessageType.Request) {
      const { payload, reqId } = evt.data as TemplePageMessage;

      getIntercom()
        .request({
          type: TempleMessageType.PageRequest,
          origin: evt.origin,
          payload,
        })
        .then((res: TempleResponse) => {
          if (res?.type === TempleMessageType.PageResponse) {
            send(
              {
                type: TemplePageMessageType.Response,
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
              type: TemplePageMessageType.ErrorResponse,
              payload: serealizeError(err),
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
          type: TempleMessageType.PageRequest,
          origin: evt.origin,
          payload: evt.data.encryptedPayload ?? evt.data.payload,
          beacon: true,
          encrypted: Boolean(evt.data.encryptedPayload),
        })
        .then((res: TempleResponse) => {
          if (res?.type === TempleMessageType.PageResponse && res.payload) {
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

function send(msg: TemplePageMessage | BeaconPageMessage, targetOrigin = "*") {
  window.postMessage(msg, targetOrigin);
}

let intercom: IntercomClient;
function getIntercom() {
  if (!intercom) {
    intercom = new IntercomClient();
  }
  return intercom;
}
