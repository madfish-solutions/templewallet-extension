import { browser, Runtime } from "webextension-polyfill-ts";
import {
  MessageType,
  ResponseSuccessMessage,
  ResponseErrorMessage,
  SubscriptionMessage
} from "./types";
import { listeners } from "cluster";

const DEFAULT_ERROR_MESSAGE = "Unexpected error occured";

type Listener = (payload: any) => Promise<any>;

function makeResponse(
  data: any,
  type: MessageType.Err | MessageType.Res,
  reqId: number
): ResponseSuccessMessage | ResponseErrorMessage {
  return { reqId, data, type };
}

function makeSubscriptionMessage(data: any): SubscriptionMessage {
  return { data, type: MessageType.Sub };
}

export class IntercomServer {
  private ports = new Set<Runtime.Port>();
  constructor() {
    /* handling of new incoming and closed connections */
    browser.runtime.onConnect.addListener(port => {
      if (!this.ports.has(port)) {
        this.ports.add(port);
      }
      port.onDisconnect.addListener(() => {
        this.ports.delete(port);
      });
    });
  }

  /**
   * Callback should return a promise
   */
  subscribeToRequests(callback: (payload: any) => Promise<any>): () => void {
    const portListeners = new Map<Runtime.Port, Listener>();
    this.ports.forEach(port => {
      const listener = async (message: any) => {
        try {
          const data = await callback(message.payload);
          this._respond(data, MessageType.Res, message.reqId, port);
        } catch (e) {
          this._respond(
            "message" in e ? e.message : DEFAULT_ERROR_MESSAGE,
            MessageType.Err,
            message.reqId,
            port
          );
        }
      };
      portListeners.set(port, listener);
      port.onMessage.addListener(listener);
    });

    return () =>
      portListeners.forEach((listener, port) =>
        port.onMessage.removeListener(listener)
      );
  }

  private _respond(
    data: any,
    type: MessageType.Err | MessageType.Res,
    reqId: number,
    port: Runtime.Port
  ) {
    const msg = makeResponse(data, type, reqId);
    port.postMessage(msg);
  }

  broadcast(data: any) {
    const msg = makeSubscriptionMessage(data);
    this.ports.forEach(port => port.postMessage(msg));
  }
}
