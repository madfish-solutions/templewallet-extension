import React, { memo, Suspense, useEffect } from 'react';

import { ChainIds } from '@taquito/taquito';

import { Divider } from 'app/atoms';
import { PageTitle } from 'app/atoms/PageTitle';
import { ReactComponent as SwapIcon } from 'app/icons/swap-header.svg';
import PageLayout from 'app/layouts/PageLayout';
import { dispatch } from 'app/store';
import { resetSwapParamsAction } from 'app/store/swap/actions';
import { useNetworkSelectController, NetworkSelect } from 'app/templates/NetworkSelect';
import { SwapForm } from 'app/templates/SwapForm/SwapForm';
import { t, T } from 'lib/i18n';
import { useAccountAddressForTezos } from 'temple/front';

import TkeyAd from './assets/tkey-swap-page-ad.png';
import { useTKeyAd } from './hooks/use-tkey-ad';

export const Swap = memo(() => {
  const publicKeyHash = useAccountAddressForTezos();

  const networkSelectController = useNetworkSelectController();

  const showTKeyAd = useTKeyAd();

  useEffect(() => {
    dispatch(resetSwapParamsAction());
  }, []);

  const network = networkSelectController.network;
  const isMainnet = networkSelectController.network.chainId === ChainIds.MAINNET;

  return (
    <PageLayout pageTitle={<PageTitle icon={<SwapIcon className="w-auto h-4 stroke-current" />} title={t('swap')} />}>
      <div className="py-4">
        <div className="w-full max-w-sm mx-auto">
          <Suspense fallback={null}>
            <div className="flex">
              <span className="text-xl text-gray-900">
                <T id="network" />:
              </span>
              <div className="flex-1" />
              <NetworkSelect controller={networkSelectController} />
            </div>

            <Divider className="my-6" />

            {isMainnet && publicKeyHash ? (
              <>
                {showTKeyAd && <img src={TkeyAd} alt="Tkey Ad" className="h-full w-full mb-6" />}
                <SwapForm rpcUrl={network.rpcBaseURL} publicKeyHash={publicKeyHash} />
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
});
