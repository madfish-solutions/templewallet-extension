import React, { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { IconBase } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import { PageTitle } from 'app/atoms/PageTitle';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import PageLayout from 'app/layouts/PageLayout';
import { SwapFormControlContext, SwapFormControl } from 'app/pages/Swap/context';
import { SwapForm } from 'app/pages/Swap/form/Form';
import { SwapSelectAssetModal } from 'app/pages/Swap/modals/SwapSelectAsset';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { toastInfo } from 'app/toaster';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { t } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';
import { ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID, TempleAccountType } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { LEDGER_WEBHID_PENDING_PREFIX, useLedgerWebHidFullViewGuard } from 'lib/ui/ledger-webhid-guard';
import { LedgerFullViewPromptModal } from 'lib/ui/LedgerFullViewPrompt';
import { equalsIgnoreCase } from 'lib/utils';
import { HistoryAction, navigate, useLocation } from 'lib/woozie';
import { useAccountAddressForEvm, useAccountAddressForTezos, useAccountForEvm, useAccountForTezos } from 'temple/front';
import { useEvmChainByChainId, useTezosChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { SWAP_SLIPPAGE_TOLERANCE_STORAGE_KEY } from './constants';
import {
  SwapFieldName,
  SwapReviewData,
  isSwapEvmReviewData,
  SelectedChainAssets,
  PendingSwapReview
} from './form/interfaces';
import { ConfirmSwapModal } from './modals/ConfirmSwap';
import { SwapSettingsModal } from './modals/SwapSettings';
import { useWidgetSwapFromOverride } from './use-widget-swap-from';

interface ChainSlug {
  chainKind: TempleChainKind;
  chainId: string;
  assetSlug: string;
}

interface Props {
  from?: ChainSlug;
  to?: ChainSlug;
}

const PENDING_SWAP_STORAGE_KEY = `${LEDGER_WEBHID_PENDING_PREFIX}:swap`;

const isTempleChainKind = (value: string): value is TempleChainKind =>
  value === TempleChainKind.Tezos || value === TempleChainKind.EVM;

const parseChainSlugParam = (value: string | null): ChainSlug | undefined => {
  const [chainKind, chainId, assetSlug] = (value ?? '').split('/');

  return chainKind && isTempleChainKind(chainKind) && chainId && assetSlug
    ? { chainKind, chainId, assetSlug }
    : undefined;
};

const Swap = memo<Props>(() => {
  const formControlRef = useRef<SwapFormControl | null>(null);
  const { guard, readPending, clearPending, ledgerPromptProps } = useLedgerWebHidFullViewGuard();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const from = parseChainSlugParam(searchParams.get('from'));
  const to = parseChainSlugParam(searchParams.get('to'));

  const [slippageTolerance, setSlippageTolerance] = useStorage<number>(SWAP_SLIPPAGE_TOLERANCE_STORAGE_KEY, 0.5);

  const accountEvmAddress = useAccountAddressForEvm();
  const accountTezosAddress = useAccountAddressForTezos();
  const { filterChain } = useAssetsFilterOptionsSelector();

  const [activeField, setActiveField] = useState<SwapFieldName>('input');
  const [selectedChainAssets, setSelectedChainAssets] = useState<SelectedChainAssets>(() => {
    const fromSlug = from ? toChainAssetSlug(from.chainKind, from.chainId, from.assetSlug) : null;
    const toSlug = to ? toChainAssetSlug(to.chainKind, to.chainId, to.assetSlug) : null;

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

  const fromBalanceRequested = searchParams.get('fromBalance') === '1';
  const widgetToSymbol = searchParams.get('toSymbol');

  useEffect(() => {
    if (fromBalanceRequested && widgetToSymbol) toastInfo(t('tokenIsReadyToSwap', widgetToSymbol));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baselineFromSlug = from ? toChainAssetSlug(from.chainKind, from.chainId, from.assetSlug) : null;
  const widgetFromOverride = useWidgetSwapFromOverride(fromBalanceRequested, from?.chainKind, from?.chainId);
  const widgetFromAppliedRef = useRef(false);

  useEffect(() => {
    if (widgetFromAppliedRef.current) return;
    if (!fromBalanceRequested || !widgetFromOverride || !baselineFromSlug) return;

    widgetFromAppliedRef.current = true;

    const toSlug = selectedChainAssets.to;
    if (
      selectedChainAssets.from !== baselineFromSlug ||
      widgetFromOverride === baselineFromSlug ||
      (toSlug != null && equalsIgnoreCase(widgetFromOverride, toSlug))
    ) {
      return;
    }

    setSelectedChainAssets(prev => ({ ...prev, from: widgetFromOverride }));
    formControlRef.current?.handleSelectedAssetChange?.('input', widgetFromOverride);
  }, [
    fromBalanceRequested,
    widgetFromOverride,
    baselineFromSlug,
    selectedChainAssets.from,
    selectedChainAssets.to,
    setSelectedChainAssets,
    formControlRef
  ]);

  const [selectAssetModalOpened, setSelectAssetModalOpen, setSelectAssetModalClosed] = useBooleanState(false);
  const [settingsModalOpened, setSettingsModalOpen, setSettingsModalClosed] = useBooleanState(false);
  const [confirmSwapModalOpened, setConfirmSwapModalOpen, setConfirmSwapModalClosed] = useBooleanState(false);

  const [reviewData, setReviewData] = useState<SwapReviewData>();

  const evmAccount = useAccountForEvm();
  const tezosAccount = useAccountForTezos();

  const storedPending = useMemo(() => readPending<PendingSwapReview>(PENDING_SWAP_STORAGE_KEY), [readPending]);
  const pendingEvmChainId = storedPending?.kind === TempleChainKind.EVM ? storedPending.chainId : undefined;
  const pendingTezosChainId = storedPending?.kind === TempleChainKind.Tezos ? storedPending.chainId : undefined;
  const evmNetworkForPending = useEvmChainByChainId(pendingEvmChainId ?? 0);
  const tezosNetworkForPending = useTezosChainByChainId(pendingTezosChainId ?? '');

  useEffect(() => {
    if (!storedPending) return;

    setSelectedChainAssets(storedPending.selectedChainAssets);

    if (storedPending.kind === TempleChainKind.EVM) {
      if (!evmAccount || !evmNetworkForPending) return;

      setReviewData({
        account: evmAccount,
        network: evmNetworkForPending,
        swapRoute: storedPending.swapRoute,
        handleResetForm: () => formControlRef.current?.resetForm?.()
      });
      setConfirmSwapModalOpen();
      clearPending(PENDING_SWAP_STORAGE_KEY);

      return;
    }

    if (!tezosAccount || !tezosNetworkForPending) return;

    setReviewData({
      account: tezosAccount,
      network: tezosNetworkForPending,
      opParams: storedPending.opParams,
      cashbackInTkey: storedPending.cashbackInTkey,
      minimumReceived: storedPending.minimumReceived,
      onConfirm: operation => {
        formControlRef.current?.resetForm?.();
        formControlRef.current?.setTezosOperation?.(operation);
      }
    });
    setConfirmSwapModalOpen();
    clearPending(PENDING_SWAP_STORAGE_KEY);
  }, [
    storedPending,
    evmAccount,
    tezosAccount,
    evmNetworkForPending,
    tezosNetworkForPending,
    clearPending,
    setConfirmSwapModalOpen,
    formControlRef,
    setSelectedChainAssets
  ]);

  const handleAssetSelect = useCallback(
    (slug: string) => {
      navigate({ pathname: '/swap' }, HistoryAction.Replace);
      const selectedChainKind = parseChainAssetSlug(slug)[0];
      const fieldKey = activeField === 'input' ? 'from' : 'to';
      const shouldSyncSelectedAsset = selectedChainKind === activeChainKind && selectedChainAssets[fieldKey] !== slug;

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

      if (shouldSyncSelectedAsset) {
        formControlRef.current?.handleSelectedAssetChange?.(activeField, slug);
      }

      setSelectAssetModalClosed();
    },
    [activeChainKind, activeField, selectedChainAssets, setSelectAssetModalClosed]
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

  const buildPendingReview = useCallback(
    (data: SwapReviewData): PendingSwapReview =>
      isSwapEvmReviewData(data)
        ? {
            kind: TempleChainKind.EVM,
            chainId: data.network.chainId,
            swapRoute: data.swapRoute,
            selectedChainAssets
          }
        : {
            kind: TempleChainKind.Tezos,
            chainId: data.network.chainId,
            opParams: data.opParams,
            cashbackInTkey: data.cashbackInTkey,
            minimumReceived: data.minimumReceived,
            selectedChainAssets
          },
    [selectedChainAssets]
  );

  const handleReview = useCallback(
    (data: SwapReviewData) => {
      setReviewData(data);

      const proceed = async () => {
        if (data.account.type === TempleAccountType.Ledger) {
          const persistable = buildPendingReview(data);
          const redirected = await guard(data.account.type, {
            persist: {
              key: PENDING_SWAP_STORAGE_KEY,
              data: persistable
            }
          });
          if (redirected) return;
        }

        setConfirmSwapModalOpen();
      };

      void proceed();
    },
    [buildPendingReview, guard, setConfirmSwapModalOpen]
  );

  const handleConfirmSlippageTolerance = useCallback(
    (slippageTolerance: number) => {
      setSlippageTolerance(slippageTolerance);
      setSettingsModalClosed();
    },
    [setSettingsModalClosed, setSlippageTolerance]
  );

  return (
    <PageLayout
      pageTitle={<PageTitle title={t('swap')} />}
      contentPadding={false}
      noScroll
      paperClassName="overflow-hidden!"
      headerRightElem={
        <IconBase Icon={ManageIcon} className="text-primary cursor-pointer" onClick={setSettingsModalOpen} />
      }
    >
      <Suspense fallback={<PageLoader stretch />}>
        <SwapFormControlContext value={formControlRef}>
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
            confirmSwapModalOpened={confirmSwapModalOpened}
            handleToggleIconClick={handleToggleIconClick}
          />
        </SwapFormControlContext>
      </Suspense>

      <SwapSelectAssetModal
        activeField={activeField}
        onAssetSelect={handleAssetSelect}
        opened={selectAssetModalOpened}
        onRequestClose={setSelectAssetModalClosed}
        chainKind={activeChainKind}
        fromChainAssetSlug={selectedChainAssets.from}
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
      />
      <LedgerFullViewPromptModal {...ledgerPromptProps} />
    </PageLayout>
  );
});

export default Swap;
