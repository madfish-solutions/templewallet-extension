import Transport from '@ledgerhq/hw-transport';
import U2FTransport from '@ledgerhq/hw-transport-u2f';
import WebAuthnTransport from '@ledgerhq/hw-transport-webauthn';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';

import { TransportType, BridgeExchangeRequest } from './types';

export class TransportBridge {
  private transport?: Transport | U2FTransport;

  async requestExchange(data: BridgeExchangeRequest) {
    try {
      return await this.exchange(data.apdu, data.transportType, data.scrambleKey, data.exchangeTimeout);
    } catch (error) {
      console.error(`TransportBridge.requestExchange() error:`, error);
      if (error && error instanceof Error) throw new Error(error.message ?? 'Unexpected error');
    }
    throw new Error('Unknown error');
  }

  async close() {
    if (this.transport == null) return;
    try {
      await this.transport.close();
    } catch (error) {
      console.error(`TransportBridge.close() error:`, error);
    }
    delete this.transport;
  }

  private async exchange(apdu: string, transportType: TransportType, scrambleKey?: string, exchangeTimeout?: number) {
    const transport = await this.getOrCreateTransport(transportType);
    if (exchangeTimeout) transport.setExchangeTimeout(exchangeTimeout);
    if (scrambleKey) transport.setScrambleKey(scrambleKey);
    const resultBuf = await transport.exchange(Buffer.from(apdu, 'hex'));
    return resultBuf.toString('hex');
  }

  private async getOrCreateTransport(transportType: TransportType) {
    const transport = this.transport;

    if (transport == null) return await this.createTransport(transportType);

    if (transportType === TransportType.WEBHID && transport instanceof TransportWebHID) {
      const device = transport.device;
      const nameOfDeviceType = device && device.constructor.name;
      const deviceIsOpen = device && device.opened;
      if (nameOfDeviceType === 'HIDDevice' && deviceIsOpen) return transport;

      const bufferTransport = await TransportWebHID.openConnected();
      if (bufferTransport) this.transport = bufferTransport;
    }

    return this.transport!;
  }

  private async createTransport(transportType: TransportType) {
    switch (transportType) {
      case TransportType.WEBHID:
        this.transport = await TransportWebHID.create();
        break;
      case TransportType.WEBAUTHN:
        this.transport = await WebAuthnTransport.create();
        break;
      default:
        this.transport = await U2FTransport.create();
    }

    return this.transport!;
  }
}
