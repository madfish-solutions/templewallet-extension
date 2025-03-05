import { useCallback, useMemo } from 'react';

import { DerivationType } from '@taquito/ledger-signer';
import { getPkhfromPk } from '@taquito/utils';

import { useTempleClient } from 'lib/temple/front';
import { getDerivationPath, mutezToTz } from 'lib/temple/helpers';
import { StoredAccount, StoredLedgerAccount, TempleAccountType, TempleTezosChainId } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';
import { useTezosChainByChainId } from 'temple/front';
import { getReadOnlyTezos } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

export const useGetLedgerTezosAccount = () => {
  const mainnetChain = useTezosChainByChainId(TempleTezosChainId.Mainnet);
  const tezos = useMemo(() => getReadOnlyTezos(mainnetChain!.rpcBaseURL), [mainnetChain]);
  const { accounts, getLedgerTezosPk } = useTempleClient();

  return useCallback(
    async (
      derivationType = DerivationType.ED25519,
      derivationIndex = getDefaultTezosLedgerAccountIndex(accounts, derivationType)
    ) => {
      const pk = await getLedgerTezosPk(derivationType, getDerivationPath(TempleChainKind.Tezos, derivationIndex));
      const pkh = getPkhfromPk(pk);

      return {
        pk,
        pkh,
        balanceTez: await tezos.rpc
          .getBalance(pkh)
          .then(mutezToTz)
          .catch(() => ZERO),
        derivationIndex,
        derivationType
      };
    },
    [accounts, getLedgerTezosPk, tezos.rpc]
  );
};

const TEZOS_BY_INDEX_DERIVATION_REGEX = /^m\/44'\/1729'\/(\d+)'\/0'$/;

export const useUsedDerivationIndexes = (derivationType: DerivationType) => {
  const { accounts } = useTempleClient();

  return useMemo(() => getUsedDerivationIndexes(accounts, derivationType), [accounts, derivationType]);
};

const getUsedDerivationIndexes = (accounts: StoredAccount[], derivationType: DerivationType) =>
  accounts
    .filter(
      (acc): acc is StoredLedgerAccount =>
        acc.type === TempleAccountType.Ledger &&
        (acc.derivationType ?? DerivationType.ED25519) === derivationType &&
        Boolean(acc.derivationPath.match(TEZOS_BY_INDEX_DERIVATION_REGEX))
    )
    .map(account => {
      const match = account.derivationPath.match(TEZOS_BY_INDEX_DERIVATION_REGEX);

      return parseInt(match![1], 10);
    })
    .sort();

const getDefaultTezosLedgerAccountIndex = (accounts: StoredAccount[], derivationType: DerivationType) => {
  const derivationIndexes = getUsedDerivationIndexes(accounts, derivationType);
  let result = 0;
  derivationIndexes.forEach(index => {
    if (index === result) {
      result++;
    }
  });

  return result;
};
