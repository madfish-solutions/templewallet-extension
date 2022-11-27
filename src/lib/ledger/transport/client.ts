import { TransportError } from '@ledgerhq/errors';
import Transport from '@ledgerhq/hw-transport';

import type { TransportBridge } from './bridge';
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
  private bridge?: TransportBridge;

  constructor(transportType: TransportType = TransportType.U2F) {
    super();
    this.transportType = transportType;
  }

  async exchange(apdu: Buffer) {
    const bridge = await this.getBridge();
    return new Promise<Buffer>(async (resolve, reject) => {
      const exchangeTimeout: number = (this as any).exchangeTimeout;
      const msg: BridgeExchangeRequest = {
        type: BridgeMessageType.ExchangeRequest,
        apdu: apdu.toString('hex'),
        scrambleKey: this.scrambleKey?.toString('ascii'),
        exchangeTimeout,
        transportType: this.transportType
      };

      bridge.postMessage(msg).then(res => {
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
    if (this.bridge) return this.bridge.close();
  }

  private async getBridge() {
    if (this.bridge) return this.bridge;
    const TransportBridge = (await import('./bridge')).TransportBridge;
    const bridge = new TransportBridge();
    return (this.bridge = bridge);
  }
}
