import { Runtime, browser } from "webextension-polyfill-ts";
import {
  MessageType,
  RequestMessage,
  ResponseMessage,
  ErrorMessage,
  SubscriptionMessage,
} from "./types";
import { serealizeError } from "./helpers";

type ReqHandler = (payload: any, port: Runtime.Port) => Promise<any>;

export class IntercomServer {
  private ports = new Set<Runtime.Port>();
  private reqHandlers: Array<ReqHandler> = [];

  constructor() {
    browser.runtime.onConnect.addListener((port) => {
      this.addPort(port);

      port.onDisconnect.addListener(() => {
        this.removePort(port);
      });
    });

    this.handleMessage = this.handleMessage.bind(this);
  }

  isConnected(port: Runtime.Port) {
    return this.ports.has(port);
  }

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

  notify(port: Runtime.Port, data: any) {
    this.send(port, { type: MessageType.Sub, data });
  }

  onDisconnect(port: Runtime.Port, listener: () => void) {
    port.onDisconnect.addListener(listener);
    return () => port.onDisconnect.removeListener(listener);
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
              this.send(port, {
                type: MessageType.Res,
                reqId: msg.reqId,
                data,
              });

              return;
            }
          }

          throw new Error("Not Found");
        } catch (err) {
          this.send(port, {
            type: MessageType.Err,
            reqId: msg.reqId,
            data: serealizeError(err),
          });
        }
      })(msg as RequestMessage);
    }
  }

  private send(
    port: Runtime.Port,
    msg: ResponseMessage | SubscriptionMessage | ErrorMessage
  ) {
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
