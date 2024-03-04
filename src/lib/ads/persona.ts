import memoizee from 'memoizee';

import { EnvVars } from 'lib/env';

export const getPersonaAdClient = memoizee(
  async () => {
    const { PersonaAdSDK } = await import('@personaxyz/ad-sdk');

    const stageApiKey = 'XXXX_api_key_staging_XXXX';

    const apiKey = EnvVars.PERSONA_ADS_API_KEY;
    const environment = apiKey && apiKey !== stageApiKey ? 'production' : 'staging';

    const sdk = new PersonaAdSDK({
      // @ts-expect-error // for not-importable `enum ENVIRONMENT`
      environment,
      apiKey: environment === 'staging' ? stageApiKey : apiKey
    });

    const client = sdk.getClient();

    return { client, environment };
  },
  { promise: true }
);
