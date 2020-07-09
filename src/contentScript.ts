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

interface BeaconMessage {
  target: BeaconMessageTarget;
  payload: any;
}

type BeaconPageMessage =
  | BeaconMessage
  | { message: BeaconMessage; sender: { id: string } };

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
    } else if (evt.data?.target === BeaconMessageTarget.Extension) {
      getIntercom()
        .request({
          type: ThanosMessageType.PageRequest,
          origin: evt.origin,
          payload: evt.data.payload,
          beacon: true,
        })
        .then((res: ThanosResponse) => {
          if (res?.type === ThanosMessageType.PageResponse) {
            const message = {
              target: BeaconMessageTarget.Page,
              payload: res.payload,
            };
            send(
              res.payload === "pong"
                ? message
                : {
                    message,
                    sender: { id: "Thanos Wallet" },
                  },
              evt.origin
            );
          }
        })
        .catch(() => {});
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
