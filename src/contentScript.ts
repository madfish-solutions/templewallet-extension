import { IntercomClient } from "lib/intercom/client";
import { ThanosMessageType, ThanosResponse } from "lib/thanos/types";
import {
  ThanosPageMessage,
  ThanosPageMessageType,
} from "lib/thanos/dapp/types";

window.addEventListener(
  "message",
  (evt) => {
    if (
      evt.source === window &&
      evt.data?.type === ThanosPageMessageType.Request
    ) {
      const { payload, reqId } = evt.data as ThanosPageMessage;

      switch (payload) {
        case "PING":
          send(
            {
              type: ThanosPageMessageType.Response,
              payload: "PONG",
            },
            evt.origin
          );
          break;

        default:
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
      }
    }
  },
  false
);

function send(msg: ThanosPageMessage, targetOrigin = "*") {
  window.postMessage(msg, targetOrigin);
}

let intercom: IntercomClient;
function getIntercom() {
  if (!intercom) {
    intercom = new IntercomClient();
  }
  return intercom;
}
