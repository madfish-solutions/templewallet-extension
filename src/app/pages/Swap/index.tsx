import React, { memo, Suspense, useCallback, useEffect, useState } from 'react';

import { IconBase } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import { PageTitle } from 'app/atoms/PageTitle';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import PageLayout from 'app/layouts/PageLayout';
import { SwapForm } from 'app/pages/Swap/form';
import { dispatch } from 'app/store';
import { resetSwapParamsAction } from 'app/store/swap/actions';
import { t, T } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';
import { useBooleanState } from 'lib/ui/hooks';
import { useAccountForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { SWAP_SLIPPAGE_TOLERANCE_STORAGE_KEY } from './constants';
import { TezosReviewData } from './form/interfaces';
import { ConfirmSwapModal } from './modals/ConfirmSwap';
import { SwapSettingsModal } from './modals/SwapSettings';

const Swap = memo(() => {
  const account = useAccountForTezos();

  const [slippageTolerance, setSlippageTolerance] = useStorage(SWAP_SLIPPAGE_TOLERANCE_STORAGE_KEY, 0.5);

  useEffect(() => void dispatch(resetSwapParamsAction()), []);

  const [settingsModalOpened, setSettingsModalOpen, setSettingsModalClosed] = useBooleanState(false);
  const [confirmSwapModalOpened, setConfirmSwapModalOpen, setConfirmSwapModalClosed] = useBooleanState(false);

  const [reviewData, setReviewData] = useState<TezosReviewData>();

  const handleReview = useCallback(
    (data: TezosReviewData) => {
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

  return (
    <PageLayout
      pageTitle={<PageTitle title={t('swap')} />}
      contentPadding={false}
      noScroll
      headerRightElem={
        <IconBase Icon={ManageIcon} className="text-primary cursor-pointer" onClick={setSettingsModalOpen} />
      }
    >
      <div className="flex-1 flex-grow w-full max-w-sm mx-auto">
        <Suspense fallback={<PageLoader stretch />}>
          {account?.chain === TempleChainKind.Tezos ? (
            <SwapForm account={account} slippageTolerance={slippageTolerance} onReview={handleReview} />
          ) : (
            <p className="text-center text-sm">
              <T id="noExchangersAvailable" />
            </p>
          )}
        </Suspense>

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
      </div>
    </PageLayout>
  );
});

export default Swap;
