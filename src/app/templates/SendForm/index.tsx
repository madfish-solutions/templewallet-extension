import React, { FC, Suspense, useCallback, useState } from 'react';

import type { WalletOperation } from '@taquito/taquito';
import { isEqual } from 'lodash';

import AssetSelect from 'app/templates/AssetSelect';
import OperationStatus from 'app/templates/OperationStatus';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledAccountTokens } from 'lib/assets/hooks';
import { useAssetsSortPredicate } from 'lib/assets/use-filtered';
import { t } from 'lib/i18n';
import { useAccount, useChainId, useTezos, useCollectibleTokens } from 'lib/temple/front';
import { useMemoWithCompare, useSafeState } from 'lib/ui/hooks';
import { HistoryAction, navigate } from 'lib/woozie';

import AddContactModal from './AddContactModal';
import { Form } from './Form';
import { SendFormSelectors } from './selectors';
import { SpinnerSection } from './SpinnerSection';

type SendFormProps = {
  assetSlug?: string | null;
};

const SendForm: FC<SendFormProps> = ({ assetSlug = TEZ_TOKEN_SLUG }) => {
  const chainId = useChainId(true)!;
  const account = useAccount();

  const tokens = useEnabledAccountTokens();
  const { data: collectibles = [] } = useCollectibleTokens(chainId, account.publicKeyHash, true);
  const assetsSortPredicate = useAssetsSortPredicate();

  const allAssetsSlugs = useMemoWithCompare<string[]>(
    () => {
      const tokensSlugs = tokens.map(t => t.slug);
      const collectiblesSlugs = collectibles.map(c => c.tokenSlug);

      return [TEZ_TOKEN_SLUG, ...tokensSlugs.concat(collectiblesSlugs)].sort(assetsSortPredicate);
    },
    [tokens, collectibles, assetsSortPredicate],
    isEqual
  );

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
        slugs={allAssetsSlugs}
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
};

export default SendForm;
