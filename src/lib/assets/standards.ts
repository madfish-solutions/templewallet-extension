import { HttpResponseError } from '@taquito/http-utils';
import { TezosToolkit, WalletContract, Contract, ChainIds } from '@tezos-x/octez.js';
import type { MichelsonV1ExpressionExtended } from '@tezos-x/octez.js-rpc';
import retry from 'async-retry';

import { getMessage } from 'lib/i18n';

import type { TokenStandardType } from './types';

const NULL_ADDRESS = 'tz1Ke2h7sDdakHJQh8WX4Z372du1KChsksyU';
const RETRY_PARAMS = { retries: 2, minTimeout: 0, maxTimeout: 0 };

const FA1_2_ENTRYPOINTS_SCHEMA = [
  ['approve', 'pair', 'address', 'nat'],
  // TODO: investigate why different FA 1.2 tokens have different transfer schema
  // ['transfer', 'pair', 'address', 'pair'],
  ['getAllowance', 'pair', 'pair', 'contract'],
  ['getBalance', 'pair', 'address', 'contract'],
  ['getTotalSupply', 'pair', 'unit', 'contract']
];

const FA2_ENTRYPOINTS_SCHEMA = [
  ['balance_of', 'pair', 'list', 'contract'],
  ['transfer', 'list', 'pair'],
  ['update_operators', 'list', 'or']
];

/** TODO: Consider running this through back-end */
export const detectTokenStandard = async (
  tezos: TezosToolkit,
  contract: string | Contract | WalletContract
): Promise<TokenStandardType | null> => {
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
};

export const assertFa2TokenDefined = async (tezos: TezosToolkit, contract: WalletContract, tokenId = '0') => {
  const chainId = (await tezos.rpc.getChainId()) as ChainIds;

  try {
    await contract.views.balance_of([{ owner: NULL_ADDRESS, token_id: tokenId }]).read(chainId);
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof HttpResponseError) {
      const issues = error.status === 500 && error.body ? JSON.parse(error.body) : null;
      if (Array.isArray(issues) && issues.find(issue => issue.with?.string === 'FA2_TOKEN_UNDEFINED'))
        throw new IncorrectTokenIdError(getMessage('incorrectTokenIdErrorMessage'));
    }

    throw new Error(getMessage('unknownErrorCheckingSomeEntrypoint', 'balance_of'));
  }
};

export class NotMatchingStandardError extends Error {}
export class IncorrectTokenIdError extends NotMatchingStandardError {}

const isEntrypointsMatched = (entrypoints: StringRecord<MichelsonV1ExpressionExtended>, schema: string[][]) => {
  try {
    for (const [name, prim, ...args] of schema) {
      const entry = entrypoints[name];

      if (!entry || entry.prim !== prim || !entry.args || entry.args.length !== args.length) {
        return false;
      }

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const entryArg = entry.args[i];
        if (!entryArg || !('prim' in entryArg) || arg !== entryArg.prim) return false;
      }
    }

    return true;
  } catch (error) {
    console.error(error);

    return false;
  }
};
