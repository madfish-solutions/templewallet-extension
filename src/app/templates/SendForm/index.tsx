import React, { memo, Suspense, useCallback, useMemo, useState } from 'react';

import type { WalletOperation } from '@taquito/taquito';

import AssetSelect from 'app/templates/AssetSelect';
import OperationStatus from 'app/templates/OperationStatus';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledAccountTokensSlugs } from 'lib/assets/hooks';
import { t } from 'lib/i18n';
import { useTezos } from 'lib/temple/front';
import { useSafeState } from 'lib/ui/hooks';
import { HistoryAction, navigate } from 'lib/woozie';

import AddContactModal from './AddContactModal';
import { Form } from './Form';
import { SendFormSelectors } from './selectors';
import { SpinnerSection } from './SpinnerSection';

type Props = {
  assetSlug?: string | null;
};

const SendForm = memo<Props>(({ assetSlug = TEZ_TOKEN_SLUG }) => {
  const tokensSlugs = useEnabledAccountTokensSlugs();

  const assetsSlugs = useMemo<string[]>(() => {
    if (!assetSlug) return [TEZ_TOKEN_SLUG, ...tokensSlugs];
    const index = tokensSlugs.indexOf(assetSlug);

    if (index === -1) return [TEZ_TOKEN_SLUG, assetSlug, ...tokensSlugs];

    const restSlugs = [...tokensSlugs];
    tokensSlugs.splice(index, 1);

    return [TEZ_TOKEN_SLUG, ...restSlugs];
  }, [tokensSlugs, assetSlug]);

  const selectedAsset = assetSlug ?? TEZ_TOKEN_SLUG;

  const tezos = useTezos();
  const [operation, setOperation] = useSafeState<WalletOperation | null>(null, tezos.checksum);
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

  return (
    <>
      {operation && <OperationStatus typeTitle={t('transaction')} operation={operation} className="mb-8" />}

      <AssetSelect
        value={selectedAsset}
        slugs={assetsSlugs}
        onChange={handleAssetChange}
        className="mb-6"
        testIDs={{
          main: SendFormSelectors.assetDropDown,
          searchInput: SendFormSelectors.assetDropDownSearchInput
        }}
      />

      <Suspense fallback={<SpinnerSection />}>
        <Form assetSlug={selectedAsset} setOperation={setOperation} onAddContactRequested={handleAddContactRequested} />
      </Suspense>

      <AddContactModal address={addContactModalAddress} onClose={closeContactModal} />
    </>
  );
});

export default SendForm;
