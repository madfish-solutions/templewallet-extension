import React, { FC, Suspense, useCallback, useMemo, useState } from 'react';

import AssetSelect from 'app/templates/AssetSelect/AssetSelect';
import { IAsset } from 'app/templates/AssetSelect/interfaces';
import { getSlug } from 'app/templates/AssetSelect/utils';
import OperationStatus from 'app/templates/OperationStatus';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
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

const SendForm: FC<SendFormProps> = ({ assetSlug = 'tez' }) => {
  const chainId = useChainId(true)!;
  const account = useAccount();

  const { data: tokens = [] } = useDisplayedFungibleTokens(chainId, account.publicKeyHash);
  const { data: collectibles = [] } = useCollectibleTokens(chainId, account.publicKeyHash, true);

  const assets = useMemo<IAsset[]>(() => ['tez' as const, ...tokens, ...collectibles], [tokens, collectibles]);
  const selectedAsset = useMemo(() => assets.find(a => getSlug(a) === assetSlug) ?? 'tez', [assets, assetSlug]);

  const tezos = useTezos();
  const [operation, setOperation] = useSafeState<any>(null, tezos.checksum);
  const [addContactModalAddress, setAddContactModalAddress] = useState<string | null>(null);
  const { trackEvent } = useAnalytics();

  const handleAssetChange = useCallback(
    (aSlug: string) => {
      trackEvent(SendFormSelectors.AssetItemButton, AnalyticsEventCategory.ButtonPress);
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
      {operation && <OperationStatus typeTitle={t('transaction')} operation={operation} />}

      <AssetSelect value={selectedAsset} assets={assets} onChange={handleAssetChange} className="mb-6" />

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
