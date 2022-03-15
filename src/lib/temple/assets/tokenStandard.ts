import { TezosToolkit, WalletContract, Contract } from '@taquito/taquito';
import retry from 'async-retry';

import { getMessage } from 'lib/i18n';

import { TokenStandard } from './types';

const STUB_TEZOS_ADDRESS = 'tz1TTXUmQaxe1dTLPtyD4WMQP6aKYK9C8fKw';
const RETRY_PARAMS = { retries: 3, minTimeout: 0, maxTimeout: 0 };

const FA1_2_ENTRYPOINTS_SCHEMA = [
  ['approve', 'pair', 'address', 'nat'],
  ['transfer', 'pair', 'address', 'address', 'nat'],
  ['getAllowance', 'pair', 'pair', 'contract'],
  ['getBalance', 'pair', 'address', 'contract'],
  ['getTotalSupply', 'pair', 'unit', 'contract']
];

const FA2_ENTRYPOINTS_SCHEMA = [
  ['balance_of', 'pair', 'list', 'contract'],
  ['transfer', 'list', 'pair'],
  ['update_operators', 'list', 'or']
];

export async function detectTokenStandard(
  tezos: TezosToolkit,
  contract: string | Contract | WalletContract
): Promise<TokenStandard | null> {
  const { entrypoints } =
    typeof contract === 'string'
      ? await retry(() => tezos.rpc.getEntrypoints(contract), RETRY_PARAMS)
      : contract.entrypoints;

  switch (true) {
    case isEntrypointsMatched(entrypoints, FA2_ENTRYPOINTS_SCHEMA):
      return 'fa2';

    case isEntrypointsMatched(entrypoints, FA1_2_ENTRYPOINTS_SCHEMA):
      return 'fa1.2';

    default:
      return null;
  }
}

export async function assertGetBalance(
  tezos: TezosToolkit,
  contract: WalletContract,
  standard: TokenStandard,
  fa2TokenId = 0
) {
  try {
    await retry(
      () =>
        standard === 'fa2'
          ? contract.views
              .balance_of([{ owner: STUB_TEZOS_ADDRESS, token_id: fa2TokenId }])
              .read((tezos as any).lambdaContract)
          : contract.views.getBalance(STUB_TEZOS_ADDRESS).read((tezos as any).lambdaContract),
      RETRY_PARAMS
    );
  } catch (err: any) {
    if (err?.value?.string === 'FA2_TOKEN_UNDEFINED') {
      throw new IncorrectTokenIdError(getMessage('incorrectTokenIdErrorMessage'));
    } else {
      throw new Error(
        getMessage('unknownErrorCheckingSomeEntrypoint', standard === 'fa2' ? 'balance_of' : 'getBalance')
      );
    }
  }
}

export class NotMatchingStandardError extends Error {}
export class IncorrectTokenIdError extends NotMatchingStandardError {}

function isEntrypointsMatched(entrypoints: Record<string, any>, schema: string[][]) {
  try {
    for (const [name, prim, ...args] of schema) {
      const entry = entrypoints[name];
      if (
        !entry ||
        entry.prim !== prim ||
        entry.args.length !== args.length ||
        args.some((arg, i) => arg !== entry.args[i]?.prim)
      ) {
        return false;
      }
    }

    return true;
  } catch (err: any) {
    console.error(err);

    return false;
  }
}
