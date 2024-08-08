import React, { memo, Suspense, useCallback, useMemo, useState } from 'react';

import type { WalletOperation } from '@taquito/taquito';
import { isEqual } from 'lodash';

import OperationStatus from 'app/templates/OperationStatus';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledTezosChainAccountTokenSlugs } from 'lib/assets/hooks';
import { useTezosChainAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { t } from 'lib/i18n';
import { useMemoWithCompare, useSafeState } from 'lib/ui/hooks';
import { HistoryAction, navigate } from 'lib/woozie';
import { AccountForTezos } from 'temple/accounts';
import { TezosNetworkEssentials } from 'temple/networks';
import { makeTezosClientId } from 'temple/tezos';

import AddContactModal from './AddContactModal';
import AssetSelect from './AssetSelect';
import { Form } from './Form';
import { SendFormSelectors } from './selectors';
import { SpinnerSection } from './SpinnerSection';

interface Props {
  network: TezosNetworkEssentials;
  tezosAccount: AccountForTezos;
  assetSlug?: string | null;
}

const SendForm = memo<Props>(({ network, tezosAccount, assetSlug = TEZ_TOKEN_SLUG }) => {
  const tezosChainId = network.chainId;
  const publicKeyHash = tezosAccount.address;

  const tokensSlugs = useEnabledTezosChainAccountTokenSlugs(publicKeyHash, tezosChainId);

  const tokensSortPredicate = useTezosChainAccountTokensSortPredicate(publicKeyHash, tezosChainId);

  const assetsSlugs = useMemoWithCompare<string[]>(
    () => {
      const sortedSlugs = Array.from(tokensSlugs).sort(tokensSortPredicate);

      if (!assetSlug || assetSlug === TEZ_TOKEN_SLUG) return [TEZ_TOKEN_SLUG, ...sortedSlugs];

      return sortedSlugs.some(s => s === assetSlug)
        ? [TEZ_TOKEN_SLUG, ...sortedSlugs]
        : [TEZ_TOKEN_SLUG, assetSlug, ...sortedSlugs];
    },
    [tokensSortPredicate, tokensSlugs, assetSlug],
    isEqual
  );

  const selectedAsset = assetSlug ?? TEZ_TOKEN_SLUG;

  const [operation, setOperation] = useSafeState<WalletOperation | null>(
    null,
    makeTezosClientId(network.rpcBaseURL, tezosAccount.address)
  );
  const [addContactModalAddress, setAddContactModalAddress] = useState<string | null>(null);
  const { trackEvent } = useAnalytics();

  const handleAssetChange = useCallback(
    (aSlug: string) => {
      trackEvent(SendFormSelectors.assetItemButton, AnalyticsEventCategory.ButtonPress);
      navigate(`/send/${tezosChainId}/${aSlug}`, HistoryAction.Replace);
    },
    [tezosChainId, trackEvent]
  );

  const handleAddContactRequested = useCallback(
    (address: string) => {
      setAddContactModalAddress(address);
    },
    [setAddContactModalAddress]
  );

  const closeContactModal = useCallback(() => {
    setAddContactModalAddress(null);
  }, [setAddContactModalAddress]);

  const testIDs = useMemo(
    () => ({
      main: SendFormSelectors.assetDropDown,
      select: SendFormSelectors.assetDropDownSelect,
      searchInput: SendFormSelectors.assetDropDownSearchInput
    }),
    []
  );

  return (
    <>
      {operation && (
        <OperationStatus network={network} typeTitle={t('transaction')} operation={operation} className="mb-8" />
      )}

      <AssetSelect
        network={network}
        accountPkh={publicKeyHash}
        value={selectedAsset}
        slugs={assetsSlugs}
        onChange={handleAssetChange}
        className="mb-6"
        testIDs={testIDs}
      />

      <Suspense fallback={<SpinnerSection />}>
        <Form
          account={tezosAccount}
          network={network}
          assetSlug={selectedAsset}
          setOperation={setOperation}
          onAddContactRequested={handleAddContactRequested}
        />
      </Suspense>

      <AddContactModal address={addContactModalAddress} onClose={closeContactModal} />
    </>
  );
});

export default SendForm;
