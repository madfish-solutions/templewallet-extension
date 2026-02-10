import React, { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  TEZOS_MAINNET_CHAIN_ID,
  TempleAccountType
} from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { LEDGER_WEBHID_PENDING_PREFIX, useLedgerWebHidFullViewGuard } from 'lib/ui/ledger-webhid-guard';
import { LedgerFullViewPromptModal } from 'lib/ui/LedgerFullViewPrompt';
import { useAccountAddressForEvm, useAccountForTezos, useAccountForEvm } from 'temple/front';
import { useTezosChainByChainId, useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { SendFormControl, SendFormControlContext } from './context';
import { Form } from './form';
import { PendingSendReview, ReviewData } from './form/interfaces';
import { ConfirmSendModal } from './modals/ConfirmSend';
import { SelectAssetModal } from './modals/SelectAsset';

interface Props {
  chainKind?: string | null;
  chainId?: string | null;
  assetSlug?: string | null;
}

const PENDING_SEND_STORAGE_KEY = `${LEDGER_WEBHID_PENDING_PREFIX}:send`;

const Send = memo<Props>(({ chainKind, chainId, assetSlug }) => {
  const { guard, readPending, clearPending, ledgerPromptProps } = useLedgerWebHidFullViewGuard();
  const accountEvmAddress = useAccountAddressForEvm();
  const { filterChain } = useAssetsFilterOptionsSelector();
  const testnetModeEnabled = useTestnetModeEnabledSelector();

  const formControlRef = useRef<SendFormControl>(null);

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

  const storedPending = useMemo(() => readPending<PendingSendReview>(PENDING_SEND_STORAGE_KEY), [readPending]);
  const pendingEvmChainId = useMemo(
    () => (storedPending?.kind === TempleChainKind.EVM ? Number(storedPending.chainId) : undefined),
    [storedPending]
  );
  const pendingTezosChainId = useMemo(
    () => (storedPending?.kind === TempleChainKind.Tezos ? String(storedPending.chainId) : undefined),
    [storedPending]
  );
  const evmNetworkForPending = useEvmChainByChainId(pendingEvmChainId ?? 0);
  const tezosNetworkForPending = useTezosChainByChainId(pendingTezosChainId ?? '');
  const evmAccount = useAccountForEvm();
  const tezosAccount = useAccountForTezos();

  useEffect(() => {
    if (!storedPending) return;

    const fallbackSlug = toChainAssetSlug(storedPending.kind, String(storedPending.chainId), storedPending.assetSlug);
    setSelectedChainAssetSlug(storedPending.selectedChainAssetSlug ?? fallbackSlug);

    if (storedPending.kind === TempleChainKind.EVM) {
      if (!evmNetworkForPending || !evmAccount) return;
      setReviewData({
        account: evmAccount,
        network: evmNetworkForPending,
        assetSlug: storedPending.assetSlug,
        to: storedPending.to,
        amount: storedPending.amount,
        onConfirm: () => formControlRef.current?.resetForm()
      });
      setConfirmSendModalOpen();
      clearPending(PENDING_SEND_STORAGE_KEY);

      return;
    }

    if (!tezosNetworkForPending || !tezosAccount) return;
    setReviewData({
      account: tezosAccount,
      network: tezosNetworkForPending,
      assetSlug: storedPending.assetSlug,
      to: storedPending.to,
      amount: storedPending.amount,
      onConfirm: () => formControlRef.current?.resetForm()
    });
    setConfirmSendModalOpen();
    clearPending(PENDING_SEND_STORAGE_KEY);
  }, [
    storedPending,
    evmNetworkForPending,
    tezosNetworkForPending,
    evmAccount,
    tezosAccount,
    setConfirmSendModalOpen,
    clearPending
  ]);

  const handleAssetSelect = useCallback(
    (slug: string) => {
      formControlRef.current?.resetForm();
      setSelectedChainAssetSlug(slug);
      setSelectAssetModalClosed();
    },
    [setSelectAssetModalClosed]
  );

  const handleReview = useCallback(
    async (data: ReviewData) => {
      setReviewData(data);

      if (data.account.type === TempleAccountType.Ledger) {
        const redirected = await guard(data.account.type, {
          persist: {
            key: PENDING_SEND_STORAGE_KEY,
            data: {
              kind: data.network.kind,
              chainId: data.network.chainId,
              assetSlug: data.assetSlug,
              to: data.to,
              amount: data.amount,
              selectedChainAssetSlug
            }
          }
        });
        if (redirected) return;
      }

      setConfirmSendModalOpen();
    },
    [guard, selectedChainAssetSlug, setConfirmSendModalOpen]
  );

  return (
    <PageLayout pageTitle={<PageTitle title={t('send')} />} contentPadding={false} noScroll>
      <Suspense fallback={<PageLoader stretch />}>
        <SendFormControlContext value={formControlRef}>
          <Form
            selectedChainAssetSlug={selectedChainAssetSlug}
            onReview={handleReview}
            onSelectAssetClick={setSelectAssetModalOpen}
          />
        </SendFormControlContext>
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
      <LedgerFullViewPromptModal {...ledgerPromptProps} />
    </PageLayout>
  );
});

export default Send;
