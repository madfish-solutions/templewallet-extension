import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { ContentFader } from 'app/a11y/ContentFader';
import Spinner from 'app/atoms/Spinner/Spinner';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';
import Unlock from 'app/pages/Unlock/Unlock';
import { t } from 'lib/i18n';
import { useRetryableSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front/client';
import { TempleDAppPayload } from 'lib/temple/types';
import { useLocation } from 'lib/woozie';
import { TempleChainKind } from 'temple/types';

import { EvmConfirmDAppForm } from './evm-confirm-dapp-form';
import { TezosConfirmDAppForm } from './tezos-confirm-dapp-form';

const ConfirmPage = memo(() => {
  const { ready } = useTempleClient();

  if (ready)
    return (
      <div
        className={clsx(LAYOUT_CONTAINER_CLASSNAME, 'min-h-screen flex flex-col items-center justify-center bg-white')}
      >
        <SuspenseContainer
          errorMessage={t('fetchingConfirmationDetails')}
          loader={
            <div className="flex items-center justify-center h-screen">
              <div>
                <Spinner theme="primary" className="w-20" />
              </div>
            </div>
          }
        >
          <ConfirmDAppForm />

          <ContentFader />
        </SuspenseContainer>
      </div>
    );

  return <Unlock canImportNew={false} />;
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
    <EvmConfirmDAppForm payload={payload} id={id} />
  ) : (
    <TezosConfirmDAppForm payload={payload} id={id} />
  );
};
