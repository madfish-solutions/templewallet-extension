import memoizee from 'memoizee';

import { delay } from 'lib/utils';

import { OBJKT_OWNED_QUERY, OBJKT_TOKEN_QUERY, type ObjktToken, type ObjktTokenQueryResponse } from './objkt-query';

interface ObjktOwnedResponse {
  data?: { token: Array<{ holders: Array<{ quantity: number | string }> }> };
}

const TTL_MS = 10 * 60 * 1000;

const OBJKT_GRAPHQL_ENDPOINT = 'https://data.objkt.com/v3/graphql/';
const MAX_RETRIES = 2;
const BACKOFF_MS = 1000;

export const fetchObjktToken = memoizee(
  async (fa: string, tokenId: string): Promise<ObjktToken | null> => {
    try {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const response = await fetch(OBJKT_GRAPHQL_ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ query: OBJKT_TOKEN_QUERY, variables: { fa, id: tokenId } })
        });

        if (response.status === 429) {
          if (attempt === MAX_RETRIES) return null;
          await delay(BACKOFF_MS * (attempt + 1));
          continue;
        }

        if (!response.ok) return null;

        const json: ObjktTokenQueryResponse = await response.json();
        return json.data?.token[0] ?? null;
      }

      return null;
    } catch {
      return null;
    }
  },
  { promise: true, maxAge: TTL_MS, length: 2 }
);

export const fetchObjktOwnedCount = memoizee(
  async (contract: string, tokenId: string, addressesKey: string): Promise<number> => {
    const addresses = addressesKey ? addressesKey.split(',') : [];
    if (addresses.length === 0) return 0;

    try {
      const response = await fetch(OBJKT_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: OBJKT_OWNED_QUERY, variables: { fa: contract, id: tokenId, addresses } })
      });

      if (!response.ok) return 0;

      const json: ObjktOwnedResponse = await response.json();
      const holders = json.data?.token[0]?.holders ?? [];
      return holders.reduce((sum, holder) => sum + Number(holder.quantity), 0);
    } catch {
      return 0;
    }
  },
  { promise: true, maxAge: TTL_MS, length: 3 }
);
