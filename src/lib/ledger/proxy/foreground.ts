import browser from 'webextension-polyfill';

import { getLedgerTransportType } from 'lib/temple/ledger';

import { createLedgerSigner } from '../creator';
import type { TempleLedgerSigner } from '../signer';
import { TransportType } from '../transport';
import type { RequestMessage, ForegroundResponse, CreatorArguments } from './types';
import { stringToUInt8Array } from './utils';

let windowIsActive = document.hasFocus();

window.onfocus = () => {
  windowIsActive = true;
};

window.onblur = () => {
  windowIsActive = false;
};

browser.runtime.onMessage.addListener((message: unknown) => {
  if (!isKnownMessage(message)) return;
  if (!isForThisPage()) return;

  return buildSignerCallResponse(message);
});

const isKnownMessage = (msg: any): msg is RequestMessage =>
  typeof msg === 'object' && msg !== null && msg.type === 'LEDGER_PROXY_REQUEST';

const isForThisPage = (): boolean => {
  const transportType = getLedgerTransportType();
  if (windowIsActive) return true;
  if (transportType === TransportType.LEDGERLIVE) return getPagesWindows()[0]! === window;
  return false;
};

function getPagesWindows() {
  const windows = browser.extension.getViews();
  const bgWindow: Window | null = browser.extension.getBackgroundPage();
  if (bgWindow) {
    const index = windows.indexOf(bgWindow);
    if (index > -1) windows.splice(index, 1);
  }

  return windows;
}

const buildSignerCallResponse = async (message: RequestMessage): Promise<ForegroundResponse> => {
  try {
    const { signer } = await createLedgerSignerLocal(message.instanceId, message.creatorArgs);
    try {
      const value = await callSignerMethod(signer, message);
      return { type: 'success', value };
    } catch (err: any) {
      return { type: 'error', message: err.message };
    }
  } catch (error: any) {
    console.error(error);
    return { type: 'error', message: `Error, when creating a signer` };
  }
};

let keptSigner: {
  instanceId: number;
  signer: TempleLedgerSigner;
} | null = null;

const createLedgerSignerLocal = async (instanceId: number, creatorArgs: CreatorArguments) => {
  if (keptSigner?.instanceId !== instanceId) {
    const { derivationPath, derivationType, publicKey, publicKeyHash } = creatorArgs;
    const { signer } = await createLedgerSigner(derivationPath, derivationType, publicKey, publicKeyHash);
    keptSigner = { instanceId, signer };
  }

  return keptSigner;
};

const callSignerMethod = (signer: TempleLedgerSigner, message: RequestMessage) => {
  switch (message.method) {
    case 'publicKey':
      return signer.publicKey();
    case 'publicKeyHash':
      return signer.publicKeyHash();
    case 'sign':
      const magicByte = message.args.magicByte ? stringToUInt8Array(message.args.magicByte) : undefined;
      return signer.sign(message.args.op, magicByte);
  }
  throw new Error(`Unreachable code`);
};
