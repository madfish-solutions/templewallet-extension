import { TezosToolkit, WalletContract, Contract } from '@taquito/taquito';
import retry from 'async-retry';

import { TokenStandard } from './types';

const RETRY_PARAMS = { retries: 3, minTimeout: 0, maxTimeout: 0 };

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
