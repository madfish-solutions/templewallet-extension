import React, { FC, Suspense, useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { ReactComponent as SwapIcon } from 'app/icons/swap-header.svg';
import PageLayout from 'app/layouts/PageLayout';
import { resetSwapParamsAction } from 'app/store/swap/actions';
import { SwapForm } from 'app/templates/SwapForm/SwapForm';
import { t, T } from 'lib/i18n';
import { useNetwork } from 'lib/temple/front';

import { PageTitle } from '../../atoms/PageTitle';

export const Swap: FC = () => {
  const dispatch = useDispatch();

  const network = useNetwork();

  useEffect(() => {
    dispatch(resetSwapParamsAction());
  }, []);

  return (
    <PageLayout pageTitle={<PageTitle icon={<SwapIcon className="w-auto h-4 stroke-current" />} title={t('swap')} />}>
      <div className="py-4">
        <div className="w-full max-w-sm mx-auto">
          <Suspense fallback={null}>
            {network.type === 'main' ? (
              <SwapForm />
            ) : (
              <p className="text-center text-sm">
                <T id="noExchangersAvailable" />
              </p>
            )}
          </Suspense>
        </div>
      </div>
    </PageLayout>
  );
};
