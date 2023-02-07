import { Route3Token } from 'lib/apis/route3/get-route3-tokens';
import { toTokenSlug } from 'lib/temple/assets';

const ROUTE3_TEZOS_SLUG = '_0';

export const getRoute3TokenBySlug = (route3Tokens: Array<Route3Token>, slug: string | undefined) => {
  if (slug === 'tez') {
    return route3Tokens.find(
      ({ contract, tokenId }) => toTokenSlug(contract ?? '', tokenId ?? 0) === ROUTE3_TEZOS_SLUG
    );
  }

  return route3Tokens.find(({ contract, tokenId }) => toTokenSlug(contract ?? '', tokenId ?? 0) === slug);
};
