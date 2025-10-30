import { useCallback, useMemo } from 'react';

import { DerivationType } from '@taquito/ledger-signer';
import { getPkhfromPk } from '@taquito/utils';
import { publicKeyToAddress } from 'viem/accounts';

import { useTempleClient } from 'lib/temple/front';
import { atomsToTokens, getDerivationPath, mutezToTz } from 'lib/temple/helpers';
import { ETHEREUM_MAINNET_CHAIN_ID, TempleTezosChainId } from 'lib/temple/types';
import { ZERO, toBigNumber } from 'lib/utils/numbers';
import { getViemPublicClient } from 'temple/evm';
import { useTezosChainByChainId } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { DEFAULT_EVM_CURRENCY } from 'temple/networks';
import { getTezosReadOnlyRpcClient } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { EvmAccountProps, TezosAccountProps } from './types';

const DEFAULT_DERIVATION = DerivationType.ED25519;

export const useGetLedgerTezosAccount = () => {
  const mainnetChain = useTezosChainByChainId(TempleTezosChainId.Mainnet);
  const tezos = useMemo(() => getTezosReadOnlyRpcClient(mainnetChain!), [mainnetChain]);
  const { getLedgerTezosPk } = useTempleClient();

  return useCallback(
    async (derivationType = DEFAULT_DERIVATION, indexOrPath: string | number = 0): Promise<TezosAccountProps> => {
      const derivationPath =
        typeof indexOrPath === 'string' ? indexOrPath : getDerivationPath(TempleChainKind.Tezos, indexOrPath);
      const pk = await getLedgerTezosPk(derivationType, derivationPath);
      const pkh = getPkhfromPk(pk);

      return {
        publicKey: pk,
        address: pkh,
        balanceTez: await tezos.rpc
          .getBalance(pkh)
          .then(mutezToTz)
          .catch(() => ZERO),
        index: typeof indexOrPath === 'number' ? indexOrPath : undefined,
        derivationPath,
        derivationType,
        chain: TempleChainKind.Tezos
      };
    },
    [getLedgerTezosPk, tezos.rpc]
  );
};

export const useGetLedgerEvmAccount = () => {
  const mainnetChain = useEvmChainByChainId(ETHEREUM_MAINNET_CHAIN_ID);
  const evmToolkit = useMemo(() => getViemPublicClient(mainnetChain!), [mainnetChain]);
  const { getLedgerEVMPk } = useTempleClient();

  return useCallback(
    async (indexOrPath: string | number = 0): Promise<EvmAccountProps> => {
      const derivationPath =
        typeof indexOrPath === 'string' ? indexOrPath : getDerivationPath(TempleChainKind.EVM, indexOrPath);
      const pk = await getLedgerEVMPk(derivationPath);
      const pkh = publicKeyToAddress(pk);

      return {
        publicKey: pk,
        address: pkh,
        balanceEth: await evmToolkit
          .getBalance({ address: pkh })
          .then(atomicBalance => atomsToTokens(toBigNumber(atomicBalance), DEFAULT_EVM_CURRENCY.decimals))
          .catch(() => ZERO),
        index: typeof indexOrPath === 'number' ? indexOrPath : undefined,
        derivationPath,
        chain: TempleChainKind.EVM
      };
    },
    [evmToolkit, getLedgerEVMPk]
  );
};
