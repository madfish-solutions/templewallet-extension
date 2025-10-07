import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { PageLoader } from 'app/atoms/Loader';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { FULL_PAGE_WRAP_CLASSNAME } from 'app/layouts/containers';
import Unlock from 'app/pages/Unlock/Unlock';
import { t } from 'lib/i18n';
import { useRetryableSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front/client';
import { TempleDAppPayload } from 'lib/temple/types';
import { useLocation } from 'lib/woozie';
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
        <SuspenseContainer errorMessage={t('fetchingConfirmationDetails')} loader={<PageLoader stretch />}>
          <ConfirmDAppForm />
        </SuspenseContainer>
      ) : (
        <Unlock canImportNew={false} />
      )}
    </div>
  );
});

export default ConfirmPage;

const ConfirmDAppForm = () => {
  const { getDAppPayload } = useTempleClient();

  const loc = useLocation();
  const id = useMemo(() => {
    const usp = new URLSearchParams(loc.search);
    const pageId = usp.get('id');
    if (!pageId) {
      throw new Error(t('notIdentified'));
    }
    return pageId;
  }, [loc.search]);

  const { data } = useRetryableSWR<TempleDAppPayload, unknown, string>(id, getDAppPayload, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  const payload = data!;

  return payload.chainType === TempleChainKind.EVM ? (
    <AddChainDataProvider>
      <AddAssetProvider>
        <EvmConfirmDAppForm payload={payload} id={id} />
      </AddAssetProvider>
    </AddChainDataProvider>
  ) : (
    <TezosConfirmDAppForm payload={payload} id={id} />
  );
};
