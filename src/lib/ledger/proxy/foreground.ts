import browser from 'webextension-polyfill';

import { createLedgerSigner } from '../creator';
import type { TempleLedgerSigner } from '../signer';
import type { RequestMessage, ForegroundResponse } from './types';
import { stringToUInt8Array } from './utils';

browser.runtime.onMessage.addListener((message: unknown) => {
  if (!isKnownMessage(message)) return;
  return buildSignerCallResponse(message);
});

const isKnownMessage = (msg: any): msg is RequestMessage =>
  typeof msg === 'object' && msg.type === 'LEDGER_MV3_REQUEST';

const buildSignerCallResponse = async (message: RequestMessage): Promise<ForegroundResponse> => {
  try {
    const { derivationPath, derivationType, publicKey, publicKeyHash } = message.creatorArgs;
    const { signer } = await createLedgerSigner(derivationPath, derivationType, publicKey, publicKeyHash);
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
