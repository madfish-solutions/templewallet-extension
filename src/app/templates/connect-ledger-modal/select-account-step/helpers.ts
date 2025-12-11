import { isDefined } from '@rnw-community/shared';

import { getDerivationPath } from 'lib/temple/helpers';
import { TempleChainKind } from 'temple/types';

import { AccountProps } from '../types';

type RecognizedTezosGroupKey = 'standard' | 'galleon';

export interface GroupedLedgerAccount {
  account: AccountProps;
  listIndex: number;
}

export interface LedgerAccountsGroups {
  standard: GroupedLedgerAccount[];
  galleon: GroupedLedgerAccount[];
  other: GroupedLedgerAccount[];
}

const STANDARD_TEZOS_DERIVATION_REGEX = /^m\/44'\/1729'\/\d+'\/0'$/;
export const GALLEON_DERIVATION_REGEX = /^m\/44'\/1729'\/\d+'\/0'\/0'(?:\/\d+'?)?$/;

export const TEZOS_DERIVATION_GROUPS_METADATA: Record<
  RecognizedTezosGroupKey,
  { title: string; patternLabel: string | null }
> = {
  standard: {
    title: 'Default',
    patternLabel: null
  },
  galleon: {
    title: 'Custom',
    patternLabel: "m/44'/1729'/0'/0'/0'"
  }
};

export const TEZOS_GROUPS_RENDER_ORDER: RecognizedTezosGroupKey[] = ['standard', 'galleon'];

export const isDefaultTezosDerivationPath = (account: AccountProps) => {
  if (account.chain !== TempleChainKind.Tezos) {
    return false;
  }

  if (isDefined(account.index)) {
    return account.derivationPath === getDerivationPath(TempleChainKind.Tezos, account.index);
  }

  return STANDARD_TEZOS_DERIVATION_REGEX.test(account.derivationPath);
};

export const createEmptyLedgerAccountsGroups = (): LedgerAccountsGroups => ({
  standard: [],
  galleon: [],
  other: []
});

const TEZOS_DEFAULT_PATH_REGEX = /^m\/44'\/1729'\/(\d+)'\/0'$/;
const TEZOS_GALLEON_PATH_REGEX = /^m\/44'\/1729'\/(\d+)'\/0'\/0'(?:\/\d+'?)?$/;
const EVM_DEFAULT_PATH_REGEX = /^m\/44'\/60'\/0'\/0\/(\d+)$/;

export function getLedgerAccountIndex(account: AccountProps): number | undefined {
  if (isDefined(account.index)) {
    return account.index;
  }

  const { derivationPath } = account;

  if (account.chain === TempleChainKind.Tezos) {
    const tezosMatch = derivationPath.match(TEZOS_DEFAULT_PATH_REGEX);

    if (tezosMatch) {
      return Number(tezosMatch[1]);
    }

    const galleonMatch = derivationPath.match(TEZOS_GALLEON_PATH_REGEX);

    if (galleonMatch) {
      return Number(galleonMatch[1]);
    }
  } else if (account.chain === TempleChainKind.EVM) {
    const evmMatch = derivationPath.match(EVM_DEFAULT_PATH_REGEX);

    if (evmMatch) {
      return Number(evmMatch[1]);
    }
  }

  return undefined;
}
