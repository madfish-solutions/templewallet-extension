import { TezosToolkit } from '@taquito/taquito';

import { ActivationStatus } from './ready';

export const activateAccount = async (address: string, secret: string, tezos: TezosToolkit) => {
  let op;
  try {
    op = await tezos.tz.activate(address, secret);
  } catch (err: any) {
    const invalidActivationError = err && err.body && /Invalid activation/.test(err.body);
    if (invalidActivationError) {
      return [ActivationStatus.AlreadyActivated] as [ActivationStatus];
    }

    throw err;
  }

  return [ActivationStatus.ActivationRequestSent, op] as [ActivationStatus, typeof op];
};
