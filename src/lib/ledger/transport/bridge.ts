import Transport from '@ledgerhq/hw-transport';
import WebSocketTransport from '@ledgerhq/hw-transport-http/lib/WebSocketTransport';
import U2FTransport from '@ledgerhq/hw-transport-u2f';
import WebAuthnTransport from '@ledgerhq/hw-transport-webauthn';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import type Browser from 'webextension-polyfill';

import { TransportType, BridgeMessageType, BridgeRequest, BridgeResponse } from './types';

// URL which triggers Ledger Live app to open and handle communication
const BRIDGE_URL = 'ws://localhost:8435';

// Number of milliseconds to poll for Ledger Live and Ethereum app opening
const TRANSPORT_CHECK_DELAY = 1000;
const TRANSPORT_CHECK_LIMIT = 120;

export class TransportBridge {
  private transport?: Transport | U2FTransport;

  async postMessage(data: BridgeRequest): Promise<BridgeResponse | undefined> {
    try {
      const res = await this.handleRequest(data);
      if (res) return res;
    } catch (error) {
      console.error(error);
      if (error && error instanceof Error)
        return {
          type: BridgeMessageType.ErrorResponse,
          message: error.message ?? 'Unexpected error'
        };
    }
    return;
  }

  async close() {
    if (this.transport)
      try {
        await this.transport.close();
      } catch (error) {
        console.error(`TempleLedgerTransportBridge.close() error:`, error);
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

  private async getOrCreateTransport(transportType: TransportType) {
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
        openLedgerLiveApp();
        await checkLedgerLiveTransport();
      }

      this.transport = await WebSocketTransport.open(BRIDGE_URL);
    } else if (transportType === TransportType.WEBHID) {
      this.transport = await TransportWebHID.create();
    } else if (transportType === TransportType.WEBAUTHN) {
      this.transport = await WebAuthnTransport.create();
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

const openLedgerLiveApp = async () => {
  const url = 'ledgerlive://bridge?appName=Tezos Wallet';

  try {
    await openLedgerLiveAppWithBrowserTab(url);
  } catch {
    if (typeof window === 'undefined') {
      /* Implying Service Worker environment */
      // @ts-ignore
      await clients.openWindow(url);
    } else {
      window.open(url);
    }
  }
};

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-use-before-define
const browser: typeof Browser = globalThis.browser || globalThis.chrome;

const openLedgerLiveAppWithBrowserTab = async (url: string) => {
  const tab = await browser.tabs.create({ url });

  const tabId = tab.id!;
  const windowId = tab.windowId!;

  await browser.windows.update(windowId, { focused: true });

  const removeTab = () => browser.tabs.remove(tabId).catch(() => {});

  const tabListener = (info: Browser.Tabs.OnActivatedActiveInfoType) => {
    console.log('tab:', info);
    if (info.tabId !== tabId && info.previousTabId !== tabId) {
      browser.tabs.onActivated.removeListener(tabListener);
      removeTab();
    }
  };

  browser.tabs.onActivated.addListener(tabListener);

  const winListener = () => {
    browser.windows.get(windowId).then(
      tabWindow => {
        console.log(1, tabWindow.focused);
        if (tabWindow.focused) return;
        browser.windows.onFocusChanged.removeListener(winListener);
        removeTab();
      },
      (err: any) => {
        console.log(2, err, browser.runtime.lastError);
        browser.windows.onFocusChanged.removeListener(winListener);
      }
    );
  };

  browser.windows.onFocusChanged.addListener(winListener);
};
