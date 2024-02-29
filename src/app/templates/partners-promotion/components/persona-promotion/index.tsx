import React, { memo, useEffect } from 'react';

import { PersonaAdSDK } from '@personaxyz/ad-sdk';
import clsx from 'clsx';
import memoizee from 'memoizee';

import { EnvVars } from 'lib/env';

import ModStyles from './styles.module.css';

interface Props {
  id: string;
  className?: string;
  onReady: EmptyFn;
  onError: EmptyFn;
}

export const PersonaPromotion = memo<Props>(({ id, className, onReady, onError }) => {
  const containerId = `persona-ad-${id}`;

  useEffect(() => {
    // personaAdClient.setWalletAddress(publicKeyHash);

    // const timeout = setTimeout(onError, 2000);

    const { client, adUnitId } = getPersonaAdClient();

    client
      // @ts-expect-error
      .showBannerAd({ adUnitId, containerId }, errorMsg => {
        console.error('Persona ad error:', errorMsg);
        onError();
      })
      .then(onReady);
  }, [containerId, onReady, onError]);

  return (
    <div id={containerId} className={clsx('object-cover max-h-full max-w-full', ModStyles.container, className)} />
  );
});

const getPersonaAdClient = memoizee(() => {
  const stageApiKey = 'XXXX_api_key_staging_XXXX';

  const apiKey = EnvVars.PERSONA_ADS_API_KEY;
  const environment = apiKey && apiKey !== stageApiKey ? 'production' : 'staging';

  const sdk = new PersonaAdSDK({
    // @ts-expect-error
    environment,
    apiKey: environment === 'staging' ? stageApiKey : apiKey
  });

  const client = sdk.getClient();

  const adUnitId =
    environment === 'staging' ? 'cf20c750-2fe4-4761-861f-b73b2247fd4d' : EnvVars.PERSONA_ADS_BANNER_UNIT_ID;

  return { client, adUnitId };
});
