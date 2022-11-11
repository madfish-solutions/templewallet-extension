import { TransportError } from '@ledgerhq/errors/dist';
import Transport from '@ledgerhq/hw-transport';

import { LedgerTempleBridgeIFrame } from './iframe';
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
  private iframe: LedgerTempleBridgeIFrame;

  constructor(transportType: TransportType = TransportType.U2F) {
    super();
    this.transportType = transportType;
    this.iframe = new LedgerTempleBridgeIFrame();
  }

  exchange(apdu: Buffer) {
    return new Promise<Buffer>(async (resolve, reject) => {
      const exchangeTimeout: number = (this as any).exchangeTimeout;
      const msg: BridgeExchangeRequest = {
        type: BridgeMessageType.ExchangeRequest,
        apdu: apdu.toString('hex'),
        scrambleKey: this.scrambleKey?.toString('ascii'),
        exchangeTimeout,
        transportType: this.transportType
      };

      this.iframe.postMessage(msg).then(res => {
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

  close() {
    return this.iframe.close();
  }
}
