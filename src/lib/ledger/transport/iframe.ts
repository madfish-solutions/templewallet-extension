import 'regenerator-runtime/runtime';

import Transport from '@ledgerhq/hw-transport';
import WebSocketTransport from '@ledgerhq/hw-transport-http/lib/WebSocketTransport';
import U2FTransport from '@ledgerhq/hw-transport-u2f';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';

import { TransportType, BridgeMessageType, BridgeRequest, BridgeResponse } from './types';

// URL which triggers Ledger Live app to open and handle communication
const BRIDGE_URL = 'ws://localhost:8435';

// Number of milliseconds to poll for Ledger Live and Ethereum app opening
const TRANSPORT_CHECK_DELAY = 1000;
const TRANSPORT_CHECK_LIMIT = 120;

export class LedgerTempleBridgeIFrame {
  private transport?: Transport | TransportWebHID;

  async postMessage(data: BridgeRequest): Promise<BridgeResponse | undefined> {
    try {
      const res = await this.handleRequest(data);
      if (res) return res;
    } catch (err) {
      if (err && err instanceof Error)
        return {
          type: BridgeMessageType.ErrorResponse,
          message: err.message ?? 'Unexpected error'
        };
    }
    return;
  }

  async close() {
    if (this.transport)
      try {
        await this.transport.close();
      } catch (error) {
        console.error(`LedgerTempleBridgeIFrame.close() error:`, error);
      }
  }

  private async handleRequest(req: BridgeRequest): Promise<BridgeResponse | void> {
    switch (req.type) {
      case BridgeMessageType.ExchangeRequest:
        const result = await this.exchange(req.apdu, req.transportType, req.scrambleKey, req.exchangeTimeout);
        return {
          type: BridgeMessageType.ExchangeResponse,
          result
        };
    }
  }

  private async exchange(apdu: string, transportType: TransportType, scrambleKey?: string, exchangeTimeout?: number) {
    const t = await this.getOrCreateTransport(transportType);
    if (exchangeTimeout) t.setExchangeTimeout(exchangeTimeout);
    if (scrambleKey) t.setScrambleKey(scrambleKey);
    const resultBuf = await t.exchange(Buffer.from(apdu, 'hex'));
    return resultBuf.toString('hex');
  }

  private async getOrCreateTransport(transportType: TransportType): Promise<Transport<string> | TransportWebHID> {
    const transport = this.transport;
    if (transport) {
      if (transportType === TransportType.LEDGERLIVE) {
        try {
          await WebSocketTransport.check(BRIDGE_URL);
          return transport;
        } catch (_err) {}
      } else {
        if (transportType === TransportType.WEBHID && transport instanceof TransportWebHID) {
          const device = transport && transport.device;
          const nameOfDeviceType = device && device.constructor.name;
          const deviceIsOpen = device && device.opened;
          if (nameOfDeviceType === 'HIDDevice' && deviceIsOpen) {
            return transport;
          }
          const bufferTransport = await TransportWebHID.openConnected();
          if (bufferTransport) this.transport = bufferTransport;
        }
        return this.transport!;
      }
    }

    if (transportType === TransportType.LEDGERLIVE) {
      try {
        await WebSocketTransport.check(BRIDGE_URL);
      } catch (_err) {
        window.open('ledgerlive://bridge?appName=Tezos Wallet');
        await checkLedgerLiveTransport();
      }

      this.transport = await WebSocketTransport.open(BRIDGE_URL);
    } else if (transportType === TransportType.WEBHID) {
      this.transport = await TransportWebHID.create();
    } else {
      this.transport = await U2FTransport.create();
    }
    return this.transport!;
  }
}

function checkLedgerLiveTransport(i = 0): Promise<unknown> {
  return WebSocketTransport.check(BRIDGE_URL).catch(async () => {
    await new Promise(r => setTimeout(r, TRANSPORT_CHECK_DELAY));
    if (i < TRANSPORT_CHECK_LIMIT) {
      return checkLedgerLiveTransport(i + 1);
    } else {
      throw new Error('Ledger transport check timeout');
    }
  });
}
