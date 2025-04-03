import React, { memo, Suspense, useCallback, useEffect, useState } from 'react';

import { IconBase } from 'app/atoms';
import { PageTitle } from 'app/atoms/PageTitle';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import PageLayout from 'app/layouts/PageLayout';
import { SwapForm } from 'app/pages/Swap/form';
import { dispatch } from 'app/store';
import { resetSwapParamsAction } from 'app/store/swap/actions';
import { t, T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { useAccountAddressForTezos } from 'temple/front';

import SwapSettingsModal, { Inputs } from './modals/SwapSettings';

const Swap = memo(() => {
  const publicKeyHash = useAccountAddressForTezos();

  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5);

  useEffect(() => {
    dispatch(resetSwapParamsAction());
  }, []);

  const [settingsModalOpened, setSettingsModalOpen, setSettingsModalClosed] = useBooleanState(false);

  const handleConfirmSlippageTolerance = useCallback(
    ({ slippageTolerance }: Inputs) => {
      setSlippageTolerance(slippageTolerance ?? 0.5);
      setSettingsModalClosed();
    },
    [setSettingsModalClosed]
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
        <Suspense fallback={null}>
          {publicKeyHash ? (
            <>
              <SwapForm publicKeyHash={publicKeyHash} slippageTolerance={slippageTolerance} />
            </>
          ) : (
            <p className="text-center text-sm">
              <T id="noExchangersAvailable" />
            </p>
          )}
        </Suspense>

        <SwapSettingsModal
          onSubmit={handleConfirmSlippageTolerance}
          opened={settingsModalOpened}
          onRequestClose={setSettingsModalClosed}
        />
      </div>
    </PageLayout>
  );
});

export default Swap;
