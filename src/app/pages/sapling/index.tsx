import { memo, useCallback, useEffect, useMemo } from 'react';

import { RpcReadAdapter } from '@taquito/taquito';
import { InMemoryViewingKey, SaplingTransactionViewer } from '@tezos-x/octez.js-sapling';
import { BigNumber } from 'bignumber.js';

import { PageTitle } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import PageLayout from 'app/layouts/PageLayout';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { toastError } from 'app/toaster';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useGetTezosAccountTokenOrGasBalanceWithDecimals } from 'lib/balances/hooks';
import { TEZOS_METADATA } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';
import { SaplingCredentials, TempleTezosChainId } from 'lib/temple/types';
import { useAccountAddressForTezos, useAllTezosChains, useCurrentAccountId } from 'temple/front';
import { getTezosRpcClient } from 'temple/tezos';

import { SaplingTransactionForm } from './sapling-transaction-form';
import { ShieldedTransactionForm } from './shielded-transaction-form';
import { UnshieldedTransactionForm } from './unshielded-transaction-form';

export const Sapling = memo(() => {
  const accountId = useCurrentAccountId();
  const { getSaplingCredentials } = useTempleClient();

  const getCurrentAccountSaplingCredentials = useCallback(
    () => getSaplingCredentials(accountId),
    [accountId, getSaplingCredentials]
  );
  const { data: saplingCredentials, error: saplingCredentialsError } = useTypedSWR(
    ['sapling-credentials', accountId],
    getCurrentAccountSaplingCredentials
  );

  useEffect(() => {
    if (saplingCredentialsError) {
      console.error(saplingCredentialsError);
      toastError('Failed to get sapling credentials');
    }
  }, [saplingCredentialsError]);

  return (
    <PageLayout pageTitle={<PageTitle title="Sapling" />}>
      {saplingCredentials ? <SaplingPageContent saplingCredentials={saplingCredentials} /> : <PageLoader stretch />}
    </PageLayout>
  );
});

const SaplingPageContent = memo(({ saplingCredentials }: { saplingCredentials: SaplingCredentials }) => {
  const { viewingKey, saplingAddress } = saplingCredentials;
  const accountId = useCurrentAccountId();
  const isTestnet = useTestnetModeEnabledSelector();
  const chainId = isTestnet ? TempleTezosChainId.Ghostnet : TempleTezosChainId.Mainnet;
  const tezosChains = useAllTezosChains();
  const saplingContract = isTestnet ? 'KT1ToBD7bovonshNrxs3i4KMFuZ8PE2LUmQf' : 'KT1KzAPQdpziH3bxxJXQNmNQA46oo8tnDQfj';
  const tezosChain = tezosChains[chainId];
  const address = useAccountAddressForTezos()!;
  const getBalance = useGetTezosAccountTokenOrGasBalanceWithDecimals(address);
  const unshieldedBalance = getBalance(chainId, TEZ_TOKEN_SLUG);

  const txViewer = useMemo(
    () =>
      new SaplingTransactionViewer(
        new InMemoryViewingKey(viewingKey),
        { contractAddress: saplingContract },
        new RpcReadAdapter(getTezosRpcClient(tezosChain))
      ),
    [saplingContract, tezosChain, viewingKey]
  );

  const { data: transactions, error: transactionsError } = useTypedSWR(
    ['sapling-transactions', saplingAddress, chainId],
    () => txViewer.getIncomingAndOutgoingTransactions(),
    { revalidateOnFocus: false, revalidateOnMount: true, refreshInterval: 10_000 }
  );

  const shieldedBalance = useMemo(() => {
    if (!transactions) return;

    let balance = new BigNumber(0);
    transactions.incoming.forEach(transaction => {
      if (!transaction.isSpent) {
        balance = balance.plus(transaction.value);
      }
    });

    return balance;
  }, [transactions]);

  useEffect(() => {
    if (transactionsError) {
      console.error(transactionsError);
      toastError('Failed to get sapling transactions');
    }
  }, [transactionsError]);
  return (
    <>
      <p>Viewing key (do not disclose to keep transactions private)</p>
      <div className="overflow-x-auto">
        <pre>{viewingKey}</pre>
      </div>
      <p>Sapling address:</p>
      <div className="overflow-x-auto">
        <pre>{saplingAddress}</pre>
      </div>
      {unshieldedBalance && <p>Unshielded balance: {unshieldedBalance.toFixed()} TEZ</p>}
      {shieldedBalance && (
        <p>Shielded balance: {atomsToTokens(shieldedBalance, TEZOS_METADATA.decimals).toFixed()} TEZ</p>
      )}
      {transactions && (
        <>
          <p>Transactions:</p>
          <div className="overflow-x-auto">
            <pre>{JSON.stringify(transactions, null, 2)}</pre>
          </div>
          {unshieldedBalance?.gt(0) && (
            <ShieldedTransactionForm
              accountId={accountId}
              network={tezosChain}
              sender={address}
              saplingContractAddress={saplingContract}
            />
          )}
          {shieldedBalance!.gt(0) && (
            <>
              <SaplingTransactionForm
                accountId={accountId}
                network={tezosChain}
                sender={address}
                saplingContractAddress={saplingContract}
              />
              <UnshieldedTransactionForm
                accountId={accountId}
                network={tezosChain}
                sender={address}
                saplingContractAddress={saplingContract}
              />
            </>
          )}
        </>
      )}
    </>
  );
});
