import { createAPI } from 'lib/axios';

const API_KEY = process.env.TEMPLE_WALLET_EVERSTAKE_API_KEY;
const LINK_ID = process.env.TEMPLE_WALLET_EVERSTAKE_LINK_ID;

const api = createAPI({
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
