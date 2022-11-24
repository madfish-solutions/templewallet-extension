// @ts-ignore
import { TransportError } from '@ledgerhq/errors';
import Transport from '@ledgerhq/hw-transport';

import type { TempleLedgerBridgeIFrame } from './iframe';
import { BridgeExchangeRequest, BridgeMessageType, TransportType } from './types';

export class TempleLedgerTransport extends Transport {
  static async isSupported() {
    return true;
  }

  /** this transport is not discoverable */
  static async list() {
    return [];
  }

  /** this transport is not discoverable */
  static listen() {
    return {
      unsubscribe: () => {}
    };
  }

  scrambleKey?: Buffer;
  transportType: TransportType;
  private iframe?: TempleLedgerBridgeIFrame;

  constructor(transportType: TransportType = TransportType.U2F) {
    super();
    this.transportType = transportType;
  }

  async exchange(apdu: Buffer) {
    const iframe = await this.getIFrame();
    return new Promise<Buffer>(async (resolve, reject) => {
      const exchangeTimeout: number = (this as any).exchangeTimeout;
      const msg: BridgeExchangeRequest = {
        type: BridgeMessageType.ExchangeRequest,
        apdu: apdu.toString('hex'),
        scrambleKey: this.scrambleKey?.toString('ascii'),
        exchangeTimeout,
        transportType: this.transportType
      };

      iframe.postMessage(msg).then(res => {
        switch (res?.type) {
          case BridgeMessageType.ExchangeResponse:
            resolve(Buffer.from(res.result, 'hex'));
            break;

          case BridgeMessageType.ErrorResponse:
            reject(
              // @ts-ignore
              new TransportError(res.message)
            );
            break;

          default:
            return;
        }
      });
    });
  }

  updateTransportType(transportType: TransportType) {
    this.transportType = transportType;
  }

  setScrambleKey(scrambleKey: string) {
    this.scrambleKey = Buffer.from(scrambleKey, 'ascii');
  }

  async close() {
    if (this.iframe) return this.iframe.close();
  }

  private async getIFrame() {
    if (this.iframe) return this.iframe;
    const TempleLedgerBridgeIFrame = (await import('./iframe')).TempleLedgerBridgeIFrame;
    const iframe = new TempleLedgerBridgeIFrame();
    return (this.iframe = iframe);
  }
}
