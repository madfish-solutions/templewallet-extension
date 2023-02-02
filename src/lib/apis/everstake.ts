import axios from 'axios';

import { EnvVars } from 'lib/env';

const { TEMPLE_WALLET_EVERSTAKE_API_KEY: API_KEY, TEMPLE_WALLET_EVERSTAKE_LINK_ID: LINK_ID } = EnvVars;

const api = axios.create({
  baseURL: 'https://aff-api.everstake.one/temple',
  ...(API_KEY && {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    }
  })
});

export const submitDelegation = (transactionId: string) =>
  api.post('/delegations', {
    link_id: LINK_ID,
    delegations: [transactionId]
  });
