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

export const assertEntrypointWorking = async (
  tezos: TezosToolkit,
  contract: WalletContract,
  standard: TokenStandard,
  fa2TokenId = 0
) => {
  const chainId = (await tezos.rpc.getChainId()) as ChainIds;

  await (standard === 'fa2'
    ? assertEntrypointWorkingForFa2(contract, chainId, fa2TokenId)
    : assertEntrypointWorkingForFa12(contract, chainId));
};

const assertEntrypointWorkingForFa12 = async (contract: WalletContract, chainId: ChainIds) => {
  const entrypoint = 'getTotalSupply';
  try {
    return await retry(() => contract.views[entrypoint]([['Unit']]).read(chainId), RETRY_PARAMS);
  } catch (error) {
    console.error(error);
    throw new Error(getMessage('unknownErrorCheckingSomeEntrypoint', entrypoint));
  }
};

const assertEntrypointWorkingForFa2 = async (contract: WalletContract, chainId: ChainIds, tokenId = 0) => {
  const entrypoint = 'balance_of';
  try {
    await retry(
      () => contract.views[entrypoint]([{ owner: NULL_ADDRESS, token_id: tokenId }]).read(chainId),
      RETRY_PARAMS
    );
  } catch (error: any) {
    console.error(error);
    if (error?.value?.string === 'FA2_TOKEN_UNDEFINED') {
      throw new IncorrectTokenIdError(getMessage('incorrectTokenIdErrorMessage'));
    } else {
      throw new Error(getMessage('unknownErrorCheckingSomeEntrypoint', entrypoint));
    }
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
