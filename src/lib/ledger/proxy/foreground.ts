import browser from 'webextension-polyfill';

import { stringToUInt8Array } from 'lib/utils';

import { getLedgerTransportType } from '../helpers';
import type { TempleLedgerSigner } from '../signer';
import { TransportType } from '../types';

import type { RequestMessage, ForegroundResponse, CreatorArguments } from './types';

let windowIsActive = document.hasFocus();

window.onfocus = () => {
  windowIsActive = true;
};

window.onblur = () => {
  windowIsActive = false;
};

browser.runtime.onMessage.addListener((message: unknown): Promise<ForegroundResponse> | void => {
  if (!isKnownMessage(message)) return;

  const transportType = getLedgerTransportType();

  if ([TransportType.WEBAUTHN, TransportType.U2F].includes(transportType)) {
    /* These transports require an active window only */
    if (windowIsActive) return buildSignerCallResponse(message, transportType);
    else return;
  }

  const pagesWindows = getPagesWindows();

  /* Only letting the first page to respond */
  if (pagesWindows[0]! !== window) return;

  return buildSignerCallResponse(message, transportType);
});

const isKnownMessage = (msg: any): msg is RequestMessage =>
  typeof msg === 'object' && msg !== null && msg.type === 'LEDGER_PROXY_REQUEST';

function getPagesWindows() {
  const windows = browser.extension.getViews();
  const bgWindow: Window | null = browser.extension.getBackgroundPage();
  if (bgWindow) {
    const index = windows.indexOf(bgWindow);
    if (index > -1) windows.splice(index, 1);
  }

  return windows;
}

const buildSignerCallResponse = async (
  message: RequestMessage,
  transportType: TransportType
): Promise<ForegroundResponse> => {
  try {
    const { signer } = await createKeptLedgerSigner(message.instanceId, message.creatorArgs, transportType);
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

const createKeptLedgerSigner = async (
  instanceId: number,
  creatorArgs: CreatorArguments,
  transportType: TransportType
) => {
  if (keptSigner?.instanceId !== instanceId) {
    const { derivationPath, derivationType, publicKey, publicKeyHash } = creatorArgs;
    const createLedgerSigner = (await import('../index')).createLedgerSigner;
    const { signer } = await createLedgerSigner(
      transportType,
      derivationPath,
      derivationType,
      publicKey,
      publicKeyHash
    );
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
