import React, { memo } from 'react';

import clsx from 'clsx';

import { FADABLE_CONTENT_CLASSNAME } from 'app/a11y/content-fader';
import { PageLoader } from 'app/atoms/Loader';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import { FULL_PAGE_WRAP_CLASSNAME, LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';
import Unlock from 'app/pages/Unlock/Unlock';
import { t } from 'lib/i18n';
import { useRetryableSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front/client';
import { TempleDAppPayload } from 'lib/temple/types';
import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';
import { TempleChainKind } from 'temple/types';

import { AddAssetProvider } from './add-asset/context';
import { AddChainDataProvider } from './add-chain/context';
import { EvmConfirmDAppForm } from './evm-confirm-dapp-form';
import { useIsBrowserFullscreen } from './hooks/use-is-browser-fullscreen';
import { TezosConfirmDAppForm } from './tezos-confirm-dapp-form';

const ConfirmPage = memo(() => {
  const { ready } = useTempleClient();
  const isBrowserFullscreen = useIsBrowserFullscreen();

  return (
    <div className={clsx('w-full h-full', isBrowserFullscreen && FULL_PAGE_WRAP_CLASSNAME)}>
      {ready ? (
        <div
          className={clsx(
            LAYOUT_CONTAINER_CLASSNAME,
            'h-screen bg-white flex flex-col',
            isBrowserFullscreen && 'rounded-md shadow-bottom',
            FADABLE_CONTENT_CLASSNAME
          )}
        >
          <SuspenseContainer errorMessage={t('fetchingConfirmationDetails')} loader={<PageLoader stretch />}>
            <ConfirmDAppForm />
          </SuspenseContainer>
        </div>
      ) : (
        <Unlock canImportNew={false} />
      )}
    </div>
  );
});

export default ConfirmPage;

const ConfirmDAppForm = () => {
  const { getDAppPayload } = useTempleClient();

  const [confirmationId, setConfirmationId] = useLocationSearchParamValue('id');

  if (!confirmationId) {
    throw new Error(t('notIdentified'));
  }

  const { data } = useRetryableSWR<TempleDAppPayload, unknown, string>(confirmationId, getDAppPayload, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  const payload = data!;

  useWillUnmount(() => void setConfirmationId(null));

  return payload.chainType === TempleChainKind.EVM ? (
    <AddChainDataProvider>
      <AddAssetProvider>
        <EvmConfirmDAppForm payload={payload} id={confirmationId} />
      </AddAssetProvider>
    </AddChainDataProvider>
  ) : (
    <TezosConfirmDAppForm payload={payload} id={confirmationId} />
  );
};
