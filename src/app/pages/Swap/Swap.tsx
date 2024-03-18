import React, { FC, Suspense, useEffect } from 'react';

import { PageTitle } from 'app/atoms/PageTitle';
import { ReactComponent as SwapIcon } from 'app/icons/swap-header.svg';
import PageLayout from 'app/layouts/PageLayout';
import { dispatch } from 'app/store';
import { resetSwapParamsAction } from 'app/store/swap/actions';
import { SwapForm } from 'app/templates/SwapForm/SwapForm';
import { t, T } from 'lib/i18n';
import { useTezosAccountAddress, useTezosNetwork } from 'temple/front';

import TkeyAd from './assets/tkey-swap-page-ad.png';
import { useTKeyAd } from './hooks/use-tkey-ad';

export const Swap: FC = () => {
  const { isMainnet } = useTezosNetwork();
  const publicKeyHash = useTezosAccountAddress();

  const showTKeyAd = useTKeyAd();

  useEffect(() => {
    dispatch(resetSwapParamsAction());
  }, []);

  return (
    <PageLayout pageTitle={<PageTitle icon={<SwapIcon className="w-auto h-4 stroke-current" />} title={t('swap')} />}>
      <div className="py-4">
        <div className="w-full max-w-sm mx-auto">
          <Suspense fallback={null}>
            {isMainnet && publicKeyHash ? (
              <>
                {showTKeyAd && <img src={TkeyAd} alt="Tkey Ad" className="h-full w-full mb-6" />}
                <SwapForm publicKeyHash={publicKeyHash} />
              </>
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
