import React, { memo, Suspense, useCallback, useMemo, useState } from 'react';

import { isEqual } from 'lodash';

import AssetSelect from 'app/templates/AssetSelect';
import OperationStatus from 'app/templates/OperationStatus';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledAccountTokensSlugs } from 'lib/assets/hooks';
import { useTokensSortPredicate } from 'lib/assets/use-sorting';
import { t } from 'lib/i18n';
import { useTezos } from 'lib/temple/front';
import { useMemoWithCompare, useSafeState } from 'lib/ui/hooks';
import { HistoryAction, navigate } from 'lib/woozie';

import AddContactModal from './AddContactModal';
import { Form } from './Form';
import { SendFormSelectors } from './selectors';
import { SpinnerSection } from './SpinnerSection';

type Props = {
  assetSlug?: string | null;
};

const RELEVANT_TZKT_OPERATIONS_TYPES = ['transaction' as const];

const SendForm = memo<Props>(({ assetSlug = TEZ_TOKEN_SLUG }) => {
  const tokensSlugs = useEnabledAccountTokensSlugs();

  const tokensSortPredicate = useTokensSortPredicate();

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

  const tezos = useTezos();
  const [operationState, setOperationState] = useSafeState<OperationState | null>(null, tezos.checksum);
  const [addContactModalAddress, setAddContactModalAddress] = useState<string | null>(null);
  const { trackEvent } = useAnalytics();

  const handleAssetChange = useCallback(
    (aSlug: string) => {
      trackEvent(SendFormSelectors.assetItemButton, AnalyticsEventCategory.ButtonPress);
      navigate(`/send/${aSlug}`, HistoryAction.Replace);
    },
    [trackEvent]
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
      {operationState && (
        <OperationStatus
          typeTitle={t('transaction')}
          operation={operationState.operation}
          className="mb-8"
          operationSender={operationState.sender}
          operationsTypes={RELEVANT_TZKT_OPERATIONS_TYPES}
        />
      )}

      <AssetSelect
        value={selectedAsset}
        slugs={assetsSlugs}
        onChange={handleAssetChange}
        className="mb-6"
        testIDs={testIDs}
      />

      <Suspense fallback={<SpinnerSection />}>
        <Form
          assetSlug={selectedAsset}
          setOperationState={setOperationState}
          onAddContactRequested={handleAddContactRequested}
        />
      </Suspense>

      <AddContactModal address={addContactModalAddress} onClose={closeContactModal} />
    </>
  );
});

export default SendForm;
