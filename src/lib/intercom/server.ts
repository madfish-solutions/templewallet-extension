import { Runtime, browser } from "webextension-polyfill-ts";
import {
  MessageType,
  RequestMessage,
  ResponseMessage,
  ErrorMessage,
  SubscriptionMessage,
} from "./types";

const DEFAULT_ERROR_MESSAGE = "Unexpected error occured";

type ReqHandler = (payload: any, port: Runtime.Port) => Promise<any>;

export class IntercomServer {
  private ports = new Set<Runtime.Port>();
  private reqHandlers: Array<ReqHandler> = [];

  constructor() {
    /* handling of new incoming and closed connections */
    browser.runtime.onConnect.addListener((port) => {
      this.addPort(port);

      port.onDisconnect.addListener(() => {
        this.removePort(port);
      });
    });

    this.handleMessage = this.handleMessage.bind(this);
  }

  /**
   * Callback should return a promise
   */
  onRequest(handler: ReqHandler) {
    this.addReqHandler(handler);
    return () => {
      this.removeReqHandler(handler);
    };
  }

  broadcast(data: any) {
    const msg: SubscriptionMessage = { type: MessageType.Sub, data };
    this.ports.forEach((port) => {
      port.postMessage(msg);
    });
  }

  private handleMessage(msg: any, port: Runtime.Port) {
    if (
      port.sender?.id === browser.runtime.id &&
      msg?.type === MessageType.Req
    ) {
      (async (msg) => {
        try {
          for (const handler of this.reqHandlers) {
            const data = await handler(msg.data, port);
            if (data !== undefined) {
              this.respond(port, {
                type: MessageType.Res,
                reqId: msg.reqId,
                data,
              });

              return;
            }
          }

          throw new Error("Not Found");
        } catch (err) {
          this.respond(port, {
            type: MessageType.Err,
            reqId: msg.reqId,
            data: err?.message ?? DEFAULT_ERROR_MESSAGE,
          });
        }
      })(msg as RequestMessage);
    }
  }

  private respond(port: Runtime.Port, msg: ResponseMessage | ErrorMessage) {
    if (this.ports.has(port)) {
      port.postMessage(msg);
    }
  }

  private addPort(port: Runtime.Port) {
    port.onMessage.addListener(this.handleMessage);
    this.ports.add(port);
  }

  private removePort(port: Runtime.Port) {
    port.onMessage.removeListener(this.handleMessage);
    this.ports.delete(port);
  }

  private addReqHandler(handler: ReqHandler) {
    this.reqHandlers.unshift(handler);
  }

  private removeReqHandler(handler: ReqHandler) {
    this.reqHandlers = this.reqHandlers.filter((h) => h !== handler);
  }
}
