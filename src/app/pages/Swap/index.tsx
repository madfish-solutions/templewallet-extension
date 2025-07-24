import React, { memo, Suspense, useCallback, useMemo, useState } from 'react';

import { IconBase } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import { PageTitle } from 'app/atoms/PageTitle';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import PageLayout from 'app/layouts/PageLayout';
import { SwapForm } from 'app/pages/Swap/form/Form';
import { SwapSelectAssetModal } from 'app/pages/Swap/modals/SwapSelectAsset';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { t } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';
import { ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { HistoryAction, navigate, useLocation } from 'lib/woozie';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { SWAP_SLIPPAGE_TOLERANCE_STORAGE_KEY } from './constants';
import { SwapFieldName, SwapReviewData } from './form/interfaces';
import { ConfirmSwapModal } from './modals/ConfirmSwap';
import { SwapSettingsModal } from './modals/SwapSettings';

type ChainSlug = {
  chainKind?: string | null;
  chainId?: string | null;
  assetSlug?: string | null;
};

interface Props {
  from?: ChainSlug;
  to?: ChainSlug;
}

type SelectedChainAssets = { from: string; to: string | null } | { from: string | null; to: string };

const Swap = memo<Props>(() => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [chainKindFrom, chainIdFrom, assetSlugFrom] = (searchParams.get('from') || '').split('/');
  const [chainKindTo, chainIdTo, assetSlugTo] = (searchParams.get('to') || '').split('/');

  const from =
    chainKindFrom && chainIdFrom && assetSlugFrom
      ? { chainKind: chainKindFrom, chainId: chainIdFrom, assetSlug: assetSlugFrom }
      : undefined;
  const to =
    chainKindTo && chainIdTo && assetSlugTo
      ? { chainKind: chainKindTo, chainId: chainIdTo, assetSlug: assetSlugTo }
      : undefined;

  const [slippageTolerance, setSlippageTolerance] = useStorage(SWAP_SLIPPAGE_TOLERANCE_STORAGE_KEY, 0.5);

  const accountEvmAddress = useAccountAddressForEvm();
  const accountTezosAddress = useAccountAddressForTezos();
  const { filterChain } = useAssetsFilterOptionsSelector();

  const [activeField, setActiveField] = useState<SwapFieldName>('input');
  const [selectedChainAssets, setSelectedChainAssets] = useState<SelectedChainAssets>(() => {
    const fromSlug =
      from?.chainKind && from?.chainId && from?.assetSlug
        ? toChainAssetSlug(from.chainKind as TempleChainKind, from.chainId, from.assetSlug)
        : null;

    const toSlug =
      to?.chainKind && to?.chainId && to?.assetSlug
        ? toChainAssetSlug(to.chainKind as TempleChainKind, to.chainId, to.assetSlug)
        : null;

    if (fromSlug && toSlug) {
      return { from: fromSlug, to: toSlug };
    } else if (fromSlug) {
      return { from: fromSlug, to: null };
    } else if (toSlug) {
      return { from: null, to: toSlug };
    }

    let fallbackFrom: string;

    if (filterChain) {
      fallbackFrom = toChainAssetSlug(
        filterChain.kind,
        filterChain.chainId,
        filterChain.kind === TempleChainKind.Tezos ? TEZ_TOKEN_SLUG : EVM_TOKEN_SLUG
      );
    } else if (accountEvmAddress && !accountTezosAddress) {
      fallbackFrom = toChainAssetSlug(TempleChainKind.EVM, ETHEREUM_MAINNET_CHAIN_ID, EVM_TOKEN_SLUG);
    } else {
      fallbackFrom = toChainAssetSlug(TempleChainKind.Tezos, TEZOS_MAINNET_CHAIN_ID, TEZ_TOKEN_SLUG);
    }

    return {
      from: fallbackFrom,
      to: null
    };
  });

  const [activeChainKind, activeChainId] = useMemo(() => {
    const main = selectedChainAssets.from ?? selectedChainAssets.to;
    return main ? parseChainAssetSlug(main) : [null, null, null];
  }, [selectedChainAssets.from, selectedChainAssets.to]);

  const [selectAssetModalOpened, setSelectAssetModalOpen, setSelectAssetModalClosed] = useBooleanState(false);
  const [settingsModalOpened, setSettingsModalOpen, setSettingsModalClosed] = useBooleanState(false);
  const [confirmSwapModalOpened, setConfirmSwapModalOpen, setConfirmSwapModalClosed] = useBooleanState(false);

  const [reviewData, setReviewData] = useState<SwapReviewData>();

  const handleAssetSelect = useCallback(
    (slug: string) => {
      navigate({ pathname: '/swap' }, HistoryAction.Replace);
      const selectedChainKind = parseChainAssetSlug(slug)[0];

      if (activeField === 'input') {
        const toSlug = selectedChainAssets.to;
        const toChainKind = toSlug ? parseChainAssetSlug(toSlug)[0] : [null];

        if (slug === toSlug) {
          setSelectedChainAssets({ to: null, from: slug });
        } else if (toChainKind && toChainKind !== selectedChainKind) {
          setSelectedChainAssets({ from: slug, to: null });
        } else {
          setSelectedChainAssets({ ...selectedChainAssets, from: slug });
        }
      } else if (activeField === 'output') {
        const fromSlug = selectedChainAssets.from;
        const fromChainKind = fromSlug ? parseChainAssetSlug(fromSlug)[0] : [null];

        if (slug === fromSlug) {
          setSelectedChainAssets({ from: null, to: slug });
        } else if (fromChainKind && fromChainKind !== selectedChainKind) {
          setSelectedChainAssets({ to: slug, from: null });
        } else {
          setSelectedChainAssets({ ...selectedChainAssets, to: slug });
        }
      }

      setSelectAssetModalClosed();
    },
    [activeField, selectedChainAssets, setSelectAssetModalClosed]
  );

  const handleToggleIconClick = useCallback(() => {
    const { from, to } = selectedChainAssets;

    if (from && to) {
      setSelectedChainAssets({ from: to, to: from });
    } else if (from) {
      setSelectedChainAssets({ from: null, to: from });
    } else if (to) {
      setSelectedChainAssets({ from: to, to: null });
    }
  }, [selectedChainAssets]);

  const handleReview = useCallback(
    (data: SwapReviewData) => {
      setReviewData(data);
      setConfirmSwapModalOpen();
    },
    [setConfirmSwapModalOpen]
  );

  const handleConfirmSlippageTolerance = useCallback(
    (slippageTolerance: number) => {
      setSlippageTolerance(slippageTolerance);
      setSettingsModalClosed();
    },
    [setSettingsModalClosed, setSlippageTolerance]
  );

  console.log('selectedChainAssets', selectedChainAssets)

  return (
    <PageLayout
      pageTitle={<PageTitle title={t('swap')} />}
      contentPadding={false}
      noScroll
      paperClassName="!overflow-hidden"
      headerRightElem={
        <IconBase Icon={ManageIcon} className="text-primary cursor-pointer" onClick={setSettingsModalOpen} />
      }
    >
      <Suspense fallback={<PageLoader stretch />}>
        <SwapForm
          chainKind={activeChainKind}
          chainId={activeChainId}
          activeField={activeField}
          selectedChainAssets={selectedChainAssets}
          slippageTolerance={slippageTolerance}
          onReview={handleReview}
          onSelectAssetClick={(field: SwapFieldName) => {
            setActiveField(field);
            setSelectAssetModalOpen();
          }}
          handleToggleIconClick={handleToggleIconClick}
        />
      </Suspense>

      <SwapSelectAssetModal
        activeField={activeField}
        onAssetSelect={handleAssetSelect}
        opened={selectAssetModalOpened}
        onRequestClose={setSelectAssetModalClosed}
        chainId={activeChainId}
        chainKind={activeChainKind}
      />
      <SwapSettingsModal
        currentSlippageTolerance={slippageTolerance}
        opened={settingsModalOpened}
        onRequestClose={setSettingsModalClosed}
        onConfirm={handleConfirmSlippageTolerance}
      />
      <ConfirmSwapModal
        opened={confirmSwapModalOpened}
        onRequestClose={setConfirmSwapModalClosed}
        reviewData={reviewData}
        onReview={handleReview}
      />
    </PageLayout>
  );
});

export default Swap;
