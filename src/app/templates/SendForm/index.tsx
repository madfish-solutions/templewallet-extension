import React, { FC, Suspense, useCallback, useMemo, useState } from 'react';

import type { WalletOperation } from '@taquito/taquito';

import AssetSelect from 'app/templates/AssetSelect/AssetSelect';
import { IAsset } from 'app/templates/AssetSelect/interfaces';
import { getSlug } from 'app/templates/AssetSelect/utils';
import OperationStatus from 'app/templates/OperationStatus';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useAssetsSortPredicate } from 'lib/assets/use-filtered';
import { t } from 'lib/i18n';
import { useAccount, useChainId, useTezos, useCollectibleTokens, useDisplayedFungibleTokens } from 'lib/temple/front';
import { useSafeState } from 'lib/ui/hooks';
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

  const { data: tokens = [] } = useDisplayedFungibleTokens(chainId, account.publicKeyHash);
  const { data: collectibles = [] } = useCollectibleTokens(chainId, account.publicKeyHash, true);
  const assetsSortPredicate = useAssetsSortPredicate();

  const assets = useMemo<IAsset[]>(
    () => [TEZ_TOKEN_SLUG, ...tokens, ...collectibles].sort((a, b) => assetsSortPredicate(getSlug(a), getSlug(b))),
    [tokens, collectibles, assetsSortPredicate]
  );
  const selectedAsset = useMemo(
    () => assets.find(a => getSlug(a) === assetSlug) ?? TEZ_TOKEN_SLUG,
    [assets, assetSlug]
  );

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
        assets={assets}
        onChange={handleAssetChange}
        className="mb-6"
        testIDs={{
          main: SendFormSelectors.assetDropDown,
          select: SendFormSelectors.assetDropDownSelect,
          searchInput: SendFormSelectors.assetDropDownSearchInput
        }}
      />

      <Suspense fallback={<SpinnerSection />}>
        <Form
          assetSlug={getSlug(selectedAsset)}
          setOperation={setOperation}
          onAddContactRequested={handleAddContactRequested}
        />
      </Suspense>

      <AddContactModal address={addContactModalAddress} onClose={closeContactModal} />
    </>
  );
};

export default SendForm;
