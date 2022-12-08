import { HttpResponseError } from '@taquito/http-utils';
import { TezosToolkit, WalletContract, Contract, ChainIds } from '@taquito/taquito';
import retry from 'async-retry';

import { getMessage } from 'lib/i18n';

import { TokenStandard } from './types';

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

export const detectTokenStandard = async (
  tezos: TezosToolkit,
  contract: string | Contract | WalletContract
): Promise<TokenStandard | null> => {
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

export const assertFa2TokenDeployed = async (tezos: TezosToolkit, contract: WalletContract, tokenId = 0) => {
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

const isEntrypointsMatched = (entrypoints: Record<string, any>, schema: string[][]) => {
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
};
