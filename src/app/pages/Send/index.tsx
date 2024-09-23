import React, { memo, Suspense, useCallback, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { PageTitle } from 'app/atoms';
import PageLayout from 'app/layouts/PageLayout';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { toChainAssetSlug } from 'lib/assets/utils';
import { t } from 'lib/i18n';
import { ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { useAccountAddressForEvm } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { Form } from './form';
import { ConfirmData } from './form/interfaces';
import { SpinnerSection } from './form/SpinnerSection';
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
      return toChainAssetSlug(TempleChainKind.EVM, ETHEREUM_MAINNET_CHAIN_ID, EVM_TOKEN_SLUG);
    }

    return toChainAssetSlug(TempleChainKind.Tezos, TEZOS_MAINNET_CHAIN_ID, TEZ_TOKEN_SLUG);
  });

  const [selectAssetModalOpened, setSelectAssetModalOpen, setSelectAssetModalClosed] = useBooleanState(false);
  const [confirmSendModalOpened, setConfirmSendModalOpen, setConfirmSendModalClosed] = useBooleanState(true);

  const [confirmData, setConfirmData] = useState<ConfirmData | null>({
    amount: '0.44443',
    to: '0xd8dA6BF26964aF9D7eEd9e03E5341524FSfrw1233',
    fee: '0.0008'
  });

  const handleAssetSelect = useCallback(
    (slug: string) => {
      setSelectedChainAssetSlug(slug);
      setSelectAssetModalClosed();
    },
    [setSelectAssetModalClosed]
  );

  const handleConfirm = useCallback(
    (data: ConfirmData) => {
      setConfirmData(data);
      setConfirmSendModalOpen();
    },
    [setConfirmSendModalOpen]
  );

  return (
    <PageLayout
      pageTitle={<PageTitle title={t('send')} />}
      contentPadding={false}
      paperClassName="bg-background overflow-hidden"
    >
      <Suspense fallback={<SpinnerSection />}>
        <Form
          selectedChainAssetSlug={selectedChainAssetSlug}
          onConfirm={handleConfirm}
          onSelectAssetClick={setSelectAssetModalOpen}
        />
      </Suspense>

      <SelectAssetModal
        onAssetSelect={handleAssetSelect}
        opened={selectAssetModalOpened}
        onRequestClose={setSelectAssetModalClosed}
      />
      <ConfirmSendModal
        opened={confirmSendModalOpened && isDefined(confirmData)}
        onRequestClose={setConfirmSendModalClosed}
        chainAssetSlug={selectedChainAssetSlug}
        data={confirmData!}
      />
    </PageLayout>
  );
});

export default Send;
