import { TransportError } from '@ledgerhq/errors';
import Transport from '@ledgerhq/hw-transport';

import type { TransportBridge } from './bridge';
import { BridgeExchangeRequest, TransportType } from './types';

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

    const msg: BridgeExchangeRequest = {
      apdu: apdu.toString('hex'),
      scrambleKey: this.scrambleKey?.toString('ascii'),
      exchangeTimeout: this.exchangeTimeout,
      transportType: this.transportType
    };

    let result: string;
    try {
      result = await bridge.requestExchange(msg);
    } catch (error: any) {
      console.error(`TempleLedgerTransport.exchange() error:`, error);
      throw new TransportError(error.message, 'id');
    }

    return Buffer.from(result, 'hex');
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
