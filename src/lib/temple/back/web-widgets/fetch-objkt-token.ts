import { getCachedToken, setCachedToken, tokenCacheKey } from './cache';
import { OBJKT_TOKEN_QUERY, type ObjktToken, type ObjktTokenQueryResponse } from './objkt-query';

const OBJKT_GRAPHQL_ENDPOINT = 'https://data.objkt.com/v3/graphql/';
const MAX_RETRIES = 2;
const BACKOFF_MS = 1000;

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export const fetchObjktToken = async ({
  contract,
  tokenId
}: {
  contract: string;
  tokenId: string;
}): Promise<ObjktToken | null> => {
  const key = tokenCacheKey(contract, tokenId);
  const cached = getCachedToken(key);
  if (cached.hit) return cached.value;

  try {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(OBJKT_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: OBJKT_TOKEN_QUERY, variables: { fa: contract, id: tokenId } })
      });

      if (response.status === 429) {
        if (attempt === MAX_RETRIES) return null;
        await delay(BACKOFF_MS * (attempt + 1));
        continue;
      }

      if (!response.ok) return null;

      const json: ObjktTokenQueryResponse = await response.json();
      const token = json.data?.token[0] ?? null;
      setCachedToken(key, token);
      return token;
    }

    return null;
  } catch {
    return null;
  }
};
