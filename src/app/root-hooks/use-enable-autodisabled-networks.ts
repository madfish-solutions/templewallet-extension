import { useCallback, useEffect, useMemo, useRef } from 'react';

import { Semaphore } from 'async-mutex';
import { difference, isEqual, uniq } from 'lodash';

import { dispatch } from 'app/store';
import { loadEvmBalanceOnChainActions } from 'app/store/evm/balances/actions';
import { useAllRawEvmBalancesSelector } from 'app/store/evm/balances/selectors';
import {
  useAllEvmChainsBalancesLoadingStatesSelector,
  useEvmTokensMetadataLoadingSelector
} from 'app/store/evm/selectors';
import { processLoadedEvmTokensMetadataAction } from 'app/store/evm/tokens-metadata/actions';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { isEtherlinkSupportedChainId } from 'lib/apis/etherlink';
import { getEvmTokensMetadata } from 'lib/apis/temple/endpoints/evm';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import {
  ACCOUNTS_FOR_REENABLING_NETWORKS_STORAGE_KEY,
  SHOULD_DISABLE_NOT_ACTIVE_NETWORKS_STORAGE_KEY
} from 'lib/constants';
import { evmOnChainBalancesRequestsExecutor } from 'lib/evm/on-chain/balance';
import { EvmAssetStandard } from 'lib/evm/types';
import { useStorage } from 'lib/temple/front/storage';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { defaultStrSortPredicate } from 'lib/utils/sorting';
import { getAccountAddressForEvm, isAccountOfActableType } from 'temple/accounts';
import { useAllAccounts, useAllEvmChains } from 'temple/front';
import { useEvmChainsSpecs } from 'temple/front/use-chains-specs';

import { getEtherlinkBalances } from './evm/get-etherlink-balances';
import { makeOnEtherlinkApiSuccess } from './evm/make-on-etherlink-api-success';
import { makeOnEvmBalancesApiSuccess } from './evm/make-on-evm-balances-api-success';

export const useEnableAutodisabledNetworks = () => {
  const allRawEvmBalances = useAllRawEvmBalancesSelector();
  const evmTokensMetadata = useEvmTokensMetadataRecordSelector();
  const evmBalancesLoadingStates = useAllEvmChainsBalancesLoadingStatesSelector();
  const [, setEvmChainsSpecs] = useEvmChainsSpecs();
  const visibleEvmBalancesLoading = useMemo(
    () => Object.values(evmBalancesLoadingStates).some(({ onchain, api }) => onchain.isLoading || api.isLoading),
    [evmBalancesLoadingStates]
  );
  const visibleEvmTokensMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const [shouldDisable] = useStorage<boolean>(SHOULD_DISABLE_NOT_ACTIVE_NETWORKS_STORAGE_KEY, false);
  const [accountsForReenabling, setAccountsForReenabling] = useStorage<HexString[]>(
    ACCOUNTS_FOR_REENABLING_NETWORKS_STORAGE_KEY,
    []
  );
  const allAccounts = useAllAccounts();
  const actableEvmAccountsAddresses = useMemoWithCompare(
    () =>
      allAccounts
        .filter(isAccountOfActableType)
        .map(account => getAccountAddressForEvm(account))
        .filter((x): x is HexString => typeof x === 'string')
        .sort(defaultStrSortPredicate),
    [allAccounts]
  );
  const prevActableEvmAccountsAddressesRef = useRef(actableEvmAccountsAddresses);
  const allEvmChains = useAllEvmChains();
  const automaticallyDisabledEvmChains = useMemoWithCompare(
    () =>
      Object.values(allEvmChains).filter(
        ({ disabled, disabledAutomatically }) => disabled && disabledAutomatically !== false
      ),
    [allEvmChains]
  );

  const loadingNetworksToEnableRef = useRef(false);
  const requestsSemaphore = useMemo(() => new Semaphore(30), []);
  const waitForRequestsLimit = useCallback(async () => {
    const [, release] = await requestsSemaphore.acquire();
    setTimeout(() => release(), 1000);
  }, [requestsSemaphore]);

  useEffect(() => {
    if (
      shouldDisable ||
      automaticallyDisabledEvmChains.length === 0 ||
      visibleEvmBalancesLoading ||
      visibleEvmTokensMetadataLoading ||
      loadingNetworksToEnableRef.current
    ) {
      return;
    }

    const newActableEvmAccountsAddresses = difference(
      actableEvmAccountsAddresses,
      prevActableEvmAccountsAddressesRef.current
    );
    prevActableEvmAccountsAddressesRef.current = actableEvmAccountsAddresses;
    const newAccountsForReenabling = uniq(accountsForReenabling.concat(newActableEvmAccountsAddresses));
    if (!isEqual(newAccountsForReenabling, accountsForReenabling)) {
      setAccountsForReenabling(newAccountsForReenabling);
    }

    if (newAccountsForReenabling.length === 0) {
      return;
    }

    loadingNetworksToEnableRef.current = true;

    Promise.all(
      automaticallyDisabledEvmChains.map(async chain => {
        const { chainId } = chain;
        const storedEvmTokensMetadata = evmTokensMetadata[chainId];
        const accountsTokensResults = await Promise.allSettled(
          newAccountsForReenabling.map(async accountAddress => {
            const rawStoredEvmBalances = allRawEvmBalances[accountAddress]?.[chainId];

            if (rawStoredEvmBalances && storedEvmTokensMetadata) {
              return {
                balances: { type: 'stored', value: rawStoredEvmBalances } as const,
                tokensMetadata: { type: 'stored', value: storedEvmTokensMetadata } as const
              };
            }

            if (isEtherlinkSupportedChainId(chainId)) {
              const balances = await getEtherlinkBalances(accountAddress, chainId);

              return { balances: { type: 'etherlink', value: balances } } as const;
            }

            if (isSupportedChainId(chainId)) {
              await waitForRequestsLimit();
              const balancesResponse = await getEvmTokensMetadata(accountAddress, chainId);

              return {
                balances: { type: 'evm', value: balancesResponse } as const,
                tokensMetadata: { type: 'evm', value: balancesResponse } as const
              };
            }

            return {
              balances: {
                type: 'onchain',
                value: {
                  updateTs: Date.now(),
                  balance: await evmOnChainBalancesRequestsExecutor.executeRequest({
                    account: accountAddress,
                    network: chain,
                    assetSlug: EVM_TOKEN_SLUG,
                    assetStandard: EvmAssetStandard.NATIVE,
                    throwOnTimeout: true
                  })
                }
              } as const
            };
          })
        );
        let shouldEnableChain = false;
        const accountsChainBalancesChecked: StringRecord<boolean> = {};
        const chainsToEnable = new Set<number>();
        accountsTokensResults.forEach((result, index) => {
          const accountAddress = newAccountsForReenabling[index];
          accountsChainBalancesChecked[accountAddress] = result.status === 'fulfilled';

          if (result.status === 'rejected') {
            return;
          }

          const { balances, tokensMetadata } = result.value;
          let accountHasBalances: boolean;
          if (balances.type === 'etherlink') {
            makeOnEtherlinkApiSuccess(accountAddress)({
              chainId,
              data: balances.value,
              timestamp: new Date(balances.value.updated_at).getTime()
            });

            const { balanceItems } = balances.value;
            accountHasBalances = balanceItems.some(({ balance = '0' }) => Number(balance) > 0);
          } else if (balances.type === 'onchain') {
            const { balance, updateTs } = balances.value;
            accountHasBalances = balance.gt(0);
            dispatch(
              loadEvmBalanceOnChainActions.success({
                network: chain,
                assetSlug: EVM_TOKEN_SLUG,
                account: accountAddress,
                balance,
                timestamp: updateTs
              })
            );
          } else {
            if (balances.type === 'evm') {
              makeOnEvmBalancesApiSuccess(accountAddress)({
                chainId,
                data: balances.value,
                timestamp: new Date(balances.value.updated_at).getTime()
              });
            }
            if (tokensMetadata?.type === 'evm') {
              dispatch(processLoadedEvmTokensMetadataAction({ chainId: chain.chainId, data: tokensMetadata.value }));
            }
            const tokensMetadataRecord =
              tokensMetadata?.type === 'evm'
                ? Object.fromEntries(tokensMetadata.value.items.map(item => [toTokenSlug(item.contract_address), item]))
                : tokensMetadata!.value;
            const tokensBalancesEntries =
              balances.type === 'stored'
                ? Object.entries(balances.value)
                : balances.value.items.map(item => [toTokenSlug(item.contract_address), item.balance ?? '0'] as const);
            accountHasBalances = tokensBalancesEntries.some(
              ([assetSlug, balance]) => Number(balance) > 0 && tokensMetadataRecord[assetSlug]
            );
          }
          shouldEnableChain ||= accountHasBalances;
        });

        if (shouldEnableChain) {
          chainsToEnable.add(chainId);
        }

        return { accountsChainBalancesChecked, chainsToEnable };
      })
    )
      .then(accountsChainBalancesCheckedByChain => {
        const accountsChainsWithCheckedBalances = accountsChainBalancesCheckedByChain.reduce<StringRecord<number[]>>(
          (acc, { accountsChainBalancesChecked: balances }, index) => {
            const chain = automaticallyDisabledEvmChains[index];
            const { chainId } = chain;

            Object.entries(balances).forEach(([accountAddress, hasBalances]) => {
              if (hasBalances) {
                acc[accountAddress] = acc[accountAddress] || [];
                acc[accountAddress].push(chainId);
              }
            });

            return acc;
          },
          {}
        );
        const chainsToEnable = accountsChainBalancesCheckedByChain.reduce((acc, { chainsToEnable }) => {
          chainsToEnable.forEach(chainId => acc.add(chainId));

          return acc;
        }, new Set<number>());
        const accountsWithAllCheckedBalances = Object.entries(accountsChainsWithCheckedBalances)
          .filter(([, chainIds]) => chainIds.length === automaticallyDisabledEvmChains.length)
          .map(([accountAddress]) => accountAddress as HexString);

        return Promise.all([
          setAccountsForReenabling(prevAccounts => difference(prevAccounts, accountsWithAllCheckedBalances)),
          setEvmChainsSpecs(prevSpecs => {
            const newSpecs = { ...prevSpecs };
            chainsToEnable.forEach(chainId => {
              newSpecs[chainId] = {
                ...newSpecs[chainId],
                disabled: false,
                disabledAutomatically: false
              };
            });

            return newSpecs;
          })
        ]);
      })
      .finally(() => {
        loadingNetworksToEnableRef.current = false;
      });
  }, [
    accountsForReenabling,
    allRawEvmBalances,
    automaticallyDisabledEvmChains,
    visibleEvmBalancesLoading,
    evmTokensMetadata,
    visibleEvmTokensMetadataLoading,
    setAccountsForReenabling,
    setEvmChainsSpecs,
    shouldDisable,
    actableEvmAccountsAddresses,
    waitForRequestsLimit
  ]);
};
