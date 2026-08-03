import { EVM_TOKEN_SLUG, fromAssetSlug, TEZ_TOKEN_SLUG } from 'lib/assets';
import { toEvmAssetSlug, toTezosAssetSlug } from 'lib/assets/utils';
import { TempleChainKind } from 'temple/types';

const TOP_UP_SLUG_SEPARATOR = '::';

export const toTopUpTokenSlug = (
  tokenAddress: string | null,
  tokenId: number | undefined,
  chainKind: TempleChainKind,
  chainId: string
) => {
  let tokenSlug: string;
  const tokenIdStr = tokenId?.toString();

  if (tokenAddress === null) {
    tokenSlug = chainKind === TempleChainKind.Tezos ? TEZ_TOKEN_SLUG : EVM_TOKEN_SLUG;
  } else if (chainKind === TempleChainKind.Tezos) {
    tokenSlug = toTezosAssetSlug(tokenAddress, tokenIdStr);
  } else {
    tokenSlug = toEvmAssetSlug(tokenAddress, tokenIdStr);
  }

  return [tokenSlug, chainKind, chainId].join(TOP_UP_SLUG_SEPARATOR);
};

export const fromTopUpTokenSlug = (
  slug: string
): [[contract: string, tokenId?: string | undefined], chainKind: TempleChainKind, chainId: string] => {
  const [tokenSlug, chainKind, chainId] = slug.split(TOP_UP_SLUG_SEPARATOR);

  return [fromAssetSlug(tokenSlug), chainKind as TempleChainKind, chainId];
};
