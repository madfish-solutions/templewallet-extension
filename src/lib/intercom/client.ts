import { browser, Runtime } from "webextension-polyfill-ts";
import {
  MessageType,
  ServerMessage,
  RequestMessage,
  SubscriptionMessage
} from "./types";

function formOutcomingMessage(payload: any, reqId: number): RequestMessage {
  return { payload, reqId };
}

export class IntercomClient {
  private port: Runtime.Port;
  private reqId: number;

  constructor() {
    this.port = browser.runtime.connect();
    this.reqId = 0;
  }

  /**
   * Makes a request to background process and returns a response promise
   */
  async request(payload: any): Promise<any> {
    const requestId = this.reqId++;
    const outcomingMessage = formOutcomingMessage(payload, requestId);

    this.port.postMessage(outcomingMessage);

    return new Promise((resolve, reject) => {
      const listener = (message: any) => {
        assertServerMessage(message);
        if (message.type === MessageType.Sub) return;
        ({
          [MessageType.Res]: () => resolve(message.data),
          [MessageType.Err]: () => reject(message.data)
        }[message.type]());
        this.port.onMessage.removeListener(listener);
      };
      this.port.onMessage.addListener(listener);
    });
  }

  /**
   * Allows to subscribe to notifications channel from background process
   */
  subscribe(callback: (message: SubscriptionMessage) => void): () => void {
    const listener = (message: any) => {
      if (message.type !== MessageType.Sub) return;
      assertSubscriptionMessage(message);
      callback(message.data);
    };

    this.port.onMessage.addListener(listener);
    return () => this.port.onMessage.removeListener(listener);
  }
}

function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg);
  }
}

function assertSubscriptionMessage(
  message: any
): asserts message is SubscriptionMessage {
  assertServerMessage(message);
  assert(message.type === MessageType.Sub && !("reqId" in message));
}

function assertServerMessage(message: any): asserts message is ServerMessage {
  assert(
    typeof message === "object" && Object.keys(message).length,
    "Unexpected message that cannot be parsed"
  );
  assert(message.type in MessageType, "Unexpected message of unknown type");
}
