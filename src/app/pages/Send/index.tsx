import React, { memo, Suspense, useCallback, useState } from 'react';

import { PageTitle } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import PageLayout from 'app/layouts/PageLayout';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { toChainAssetSlug } from 'lib/assets/utils';
import { t } from 'lib/i18n';
import {
  ETH_SEPOLIA_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
  TEZOS_GHOSTNET_CHAIN_ID,
  TEZOS_MAINNET_CHAIN_ID
} from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { useAccountAddressForEvm } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { Form } from './form';
import { ReviewData } from './form/interfaces';
import { ConfirmSendModal } from './modals/ConfirmSend';
import { SelectAssetModal } from './modals/SelectAsset';

interface Props {
  chainKind?: string | null;
  chainId?: string | null;
  assetSlug?: string | null;
}

const Send = memo<Props>(({ chainKind, chainId, assetSlug }) => {
  const accountEvmAddress = useAccountAddressForEvm();
  const { filterChain } = useAssetsFilterOptionsSelector();
  const testnetModeEnabled = useTestnetModeEnabledSelector();

  const [selectedChainAssetSlug, setSelectedChainAssetSlug] = useState(() => {
    if (chainKind && chainId && assetSlug) {
      return toChainAssetSlug(chainKind as TempleChainKind, chainId, assetSlug);
    }

    if (filterChain) {
      return toChainAssetSlug(
        filterChain.kind,
        filterChain.chainId,
        filterChain.kind === TempleChainKind.Tezos ? TEZ_TOKEN_SLUG : EVM_TOKEN_SLUG
      );
    }

    if (accountEvmAddress) {
      return toChainAssetSlug(
        TempleChainKind.EVM,
        testnetModeEnabled ? ETH_SEPOLIA_CHAIN_ID : ETHEREUM_MAINNET_CHAIN_ID,
        EVM_TOKEN_SLUG
      );
    }

    return toChainAssetSlug(
      TempleChainKind.Tezos,
      testnetModeEnabled ? TEZOS_GHOSTNET_CHAIN_ID : TEZOS_MAINNET_CHAIN_ID,
      TEZ_TOKEN_SLUG
    );
  });

  const [selectAssetModalOpened, setSelectAssetModalOpen, setSelectAssetModalClosed] = useBooleanState(false);
  const [confirmSendModalOpened, setConfirmSendModalOpen, setConfirmSendModalClosed] = useBooleanState(false);

  const [reviewData, setReviewData] = useState<ReviewData>();

  const handleAssetSelect = useCallback(
    (slug: string) => {
      setSelectedChainAssetSlug(slug);
      setSelectAssetModalClosed();
    },
    [setSelectAssetModalClosed]
  );

  const handleReview = useCallback(
    (data: ReviewData) => {
      setReviewData(data);
      setConfirmSendModalOpen();
    },
    [setConfirmSendModalOpen]
  );

  return (
    <PageLayout pageTitle={<PageTitle title={t('send')} />} contentPadding={false} noScroll>
      <Suspense fallback={<PageLoader stretch />}>
        <Form
          selectedChainAssetSlug={selectedChainAssetSlug}
          onReview={handleReview}
          onSelectAssetClick={setSelectAssetModalOpen}
        />
      </Suspense>

      <SelectAssetModal
        onAssetSelect={handleAssetSelect}
        opened={selectAssetModalOpened}
        onRequestClose={setSelectAssetModalClosed}
      />
      <ConfirmSendModal
        opened={confirmSendModalOpened}
        onRequestClose={setConfirmSendModalClosed}
        reviewData={reviewData}
      />
    </PageLayout>
  );
});

export default Send;
