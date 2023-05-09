import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { toTokenSlug, TEZ_TOKEN_SLUG } from 'lib/assets';

const ROUTE3_TEZOS_SLUG = '_0';

export const getRoute3TokenBySlug = (route3Tokens: Array<Route3Token>, slug: string | undefined) => {
  if (slug === TEZ_TOKEN_SLUG) {
    return route3Tokens.find(
      ({ contract, tokenId }) => toTokenSlug(contract ?? '', tokenId ?? 0) === ROUTE3_TEZOS_SLUG
    );
  }

  return route3Tokens.find(({ contract, tokenId }) => toTokenSlug(contract ?? '', tokenId ?? 0) === slug);
};
