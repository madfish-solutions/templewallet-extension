// @ts-ignore
import { PersonaAdSDK } from '@personaxyz/ad-sdk';

const personaConfig = {
  environment: 'staging',
  apiKey: 'XXXX_api_key_staging_XXXX' // An actual API key is generated once you register an app with us. environment: 'staging', // use value 'production' when going live}
};

const sdk = new PersonaAdSDK(personaConfig);
export const persona3AdClient = sdk.getClient();
