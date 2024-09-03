import React, { memo, Suspense, useCallback, useMemo, useState } from 'react';

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
import { SpinnerSection } from './form/SpinnerSection';
import AddContactModal from './modals/AddContact';
import { SelectAssetModal } from './modals/SelectAsset';

interface Props {
  chainKind?: string | null;
  chainId?: string | null;
  assetSlug?: string | null;
}

const Send = memo<Props>(({ chainKind, chainId, assetSlug }) => {
  const accountEvmAddress = useAccountAddressForEvm();
  const { filterChain } = useAssetsFilterOptionsSelector();

  const initialSelectedChainAssetSlug = useMemo(() => {
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
  }, [accountEvmAddress, assetSlug, chainId, chainKind, filterChain]);

  const [selectedChainAssetSlug, setSelectedChainAssetSlug] = useState(initialSelectedChainAssetSlug);

  const [addContactModalAddress, setAddContactModalAddress] = useState<string | null>(null);

  const [selectAssetModalOpened, setSelectAssetModalOpen, setSelectAssetModalClosed] = useBooleanState(false);
  // TODO: handle user address select
  const [_, setAccountsModalOpen, _2] = useBooleanState(false);

  const handleAssetSelect = useCallback((slug: string) => setSelectedChainAssetSlug(slug), []);

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
    <PageLayout
      pageTitle={<PageTitle title={t('send')} />}
      contentPadding={false}
      contentClassName="bg-background overflow-hidden"
    >
      <Suspense fallback={<SpinnerSection />}>
        <Form
          selectedChainAssetSlug={selectedChainAssetSlug}
          onSelectAssetClick={setSelectAssetModalOpen}
          onSelectMyAccountClick={setAccountsModalOpen}
          onAddContactRequested={handleAddContactRequested}
        />
      </Suspense>

      <SelectAssetModal
        onAssetSelect={handleAssetSelect}
        opened={selectAssetModalOpened}
        onRequestClose={setSelectAssetModalClosed}
      />
      <AddContactModal address={addContactModalAddress} onClose={closeContactModal} />
    </PageLayout>
  );
});

export default Send;
