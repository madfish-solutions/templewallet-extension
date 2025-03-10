import { useCallback, useMemo } from 'react';

import { DerivationType } from '@taquito/ledger-signer';
import { getPkhfromPk } from '@taquito/utils';
import { publicKeyToAddress } from 'viem/accounts';

import { useTempleClient } from 'lib/temple/front';
import { atomsToTokens, getDerivationPath, mutezToTz } from 'lib/temple/helpers';
import {
  ETHEREUM_MAINNET_CHAIN_ID,
  StoredAccount,
  StoredLedgerAccount,
  TempleAccountType,
  TempleTezosChainId
} from 'lib/temple/types';
import { ZERO, toBigNumber } from 'lib/utils/numbers';
import { getReadOnlyEvmForNetwork } from 'temple/evm';
import { useTezosChainByChainId } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { DEFAULT_EVM_CURRENCY } from 'temple/networks';
import { getReadOnlyTezos } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { EvmAccountProps, TezosAccountProps } from './types';

const DEFAULT_DERIVATION = DerivationType.ED25519;

export const useGetLedgerTezosAccount = () => {
  const mainnetChain = useTezosChainByChainId(TempleTezosChainId.Mainnet);
  const tezos = useMemo(() => getReadOnlyTezos(mainnetChain!.rpcBaseURL), [mainnetChain]);
  const { accounts, getLedgerTezosPk } = useTempleClient();

  return useCallback(
    async (
      derivationType = DEFAULT_DERIVATION,
      derivationIndex = getDefaultLedgerAccountIndex(accounts, TempleChainKind.Tezos, derivationType)
    ): Promise<TezosAccountProps> => {
      const pk = await getLedgerTezosPk(derivationType, getDerivationPath(TempleChainKind.Tezos, derivationIndex));
      const pkh = getPkhfromPk(pk);

      return {
        publicKey: pk,
        address: pkh,
        balanceTez: await tezos.rpc
          .getBalance(pkh)
          .then(mutezToTz)
          .catch(() => ZERO),
        derivationIndex,
        derivationType,
        chain: TempleChainKind.Tezos
      };
    },
    [accounts, getLedgerTezosPk, tezos.rpc]
  );
};

export const useGetLedgerEvmAccount = () => {
  const mainnetChain = useEvmChainByChainId(ETHEREUM_MAINNET_CHAIN_ID);
  const evmToolkit = useMemo(() => getReadOnlyEvmForNetwork(mainnetChain!), [mainnetChain]);
  const { accounts, getLedgerEVMPk } = useTempleClient();

  return useCallback(
    async (derivationIndex = getDefaultLedgerAccountIndex(accounts, TempleChainKind.EVM)): Promise<EvmAccountProps> => {
      const pk = await getLedgerEVMPk(getDerivationPath(TempleChainKind.EVM, derivationIndex));
      const pkh = publicKeyToAddress(pk);

      return {
        publicKey: pk,
        address: pkh,
        balanceEth: await evmToolkit
          .getBalance({ address: pkh })
          .then(atomicBalance => atomsToTokens(toBigNumber(atomicBalance), DEFAULT_EVM_CURRENCY.decimals))
          .catch(() => ZERO),
        derivationIndex,
        chain: TempleChainKind.EVM
      };
    },
    [accounts, evmToolkit, getLedgerEVMPk]
  );
};

export const TEZOS_BY_INDEX_DERIVATION_REGEX = /^m\/44'\/1729'\/(\d+)'\/0'$/;
export const EVM_BY_INDEX_DERIVATION_REGEX = /^m\/44'\/60'\/0'\/0\/(\d+)$/;

export const useUsedDerivationIndexes = (chainKind: TempleChainKind, derivationType = DEFAULT_DERIVATION) => {
  const { accounts } = useTempleClient();

  return useMemo(
    () => getUsedDerivationIndexes(accounts, chainKind, derivationType),
    [accounts, chainKind, derivationType]
  );
};

function getUsedDerivationIndexes(
  accounts: StoredAccount[],
  chainKind: TempleChainKind,
  derivationType = DEFAULT_DERIVATION
) {
  const regex = chainKind === TempleChainKind.Tezos ? TEZOS_BY_INDEX_DERIVATION_REGEX : EVM_BY_INDEX_DERIVATION_REGEX;

  return accounts
    .filter(
      (acc): acc is StoredLedgerAccount =>
        acc.type === TempleAccountType.Ledger &&
        acc.chain === chainKind &&
        (acc.chain === TempleChainKind.EVM || (acc.derivationType ?? DEFAULT_DERIVATION) === derivationType) &&
        Boolean(acc.derivationPath.match(regex))
    )
    .map(account => {
      const match = account.derivationPath.match(regex);

      return parseInt(match![1], 10);
    })
    .sort();
}

export function getDefaultLedgerAccountIndex(
  accounts: StoredAccount[],
  chainKind: TempleChainKind,
  derivationType = DEFAULT_DERIVATION
) {
  const derivationIndexes = getUsedDerivationIndexes(accounts, chainKind, derivationType);
  let result = 0;
  derivationIndexes.forEach(index => {
    if (index === result) {
      result++;
    }
  });

  return result;
}
