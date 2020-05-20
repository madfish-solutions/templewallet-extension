import { ExtensionMessage } from "@airgap/beacon-sdk/dist/types/ExtensionMessage";
import { ExtensionMessageTarget } from "@airgap/beacon-sdk/dist/types/ExtensionMessageTarget";
import { IntercomClient } from "lib/intercom/client";
import {
  ThanosMessageType,
  ThanosResponse,
  ThanosBeaconRequest,
  ThanosBeaconMessage,
} from "lib/thanos/types";

// Handle message from page and redirect to background.js script.
window.addEventListener(
  "message",
  (evt) => {
    if (evt.data?.target === ExtensionMessageTarget.EXTENSION) {
      const { payload } = evt.data as ExtensionMessage<string>;

      switch (payload) {
        case "ping":
          // To detect if extension is installed or not,
          // we answer pings immediately.
          window.postMessage(
            { target: ExtensionMessageTarget.PAGE, payload: "pong" },
            "*"
          );
          subscribeOne((msg) => {
            if (msg?.type === ThanosMessageType.BeaconMessage) {
              redirectMessage((msg as ThanosBeaconMessage).payload);
            }
          });
          break;

        default:
          requestBeacon({
            type: ThanosMessageType.BeaconRequest,
            origin: evt.origin,
            payload,
          })
            .then((res: ThanosResponse) => {
              if (res?.type === ThanosMessageType.BeaconResponse) {
                redirectMessage(res.payload);
              }
            })
            .catch((err) => {
              throw err;
            });
      }
    }
  },
  false
);

function redirectMessage(payload: string) {
  window.postMessage(
    {
      message: {
        target: ExtensionMessageTarget.PAGE,
        payload,
      },
      sender: {
        id: "Thanos Wallet",
      },
    },
    "*"
  );
}

function requestBeacon(req: ThanosBeaconRequest) {
  return getIntercom().request(req);
}

let unsubscribe: () => void;
function subscribeOne(callback: (data: any) => void) {
  if (unsubscribe) {
    unsubscribe();
  }
  unsubscribe = getIntercom().subscribe(callback);
}

let intercom: IntercomClient;
function getIntercom() {
  if (!intercom) {
    intercom = new IntercomClient();
  }
  return intercom;
}

class ThanosWallet {
  public kek = "KEK";
}

(window as any).ThanosWallet = ThanosWallet;
