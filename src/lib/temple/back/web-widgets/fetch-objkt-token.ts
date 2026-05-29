import memoizee from 'memoizee';

import { OBJKT_TOKEN_QUERY, type ObjktToken, type ObjktTokenQueryResponse } from './objkt-query';

const TTL_MS = 10 * 60 * 1000;

const OBJKT_GRAPHQL_ENDPOINT = 'https://data.objkt.com/v3/graphql/';
const MAX_RETRIES = 2;
const BACKOFF_MS = 1000;

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

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
