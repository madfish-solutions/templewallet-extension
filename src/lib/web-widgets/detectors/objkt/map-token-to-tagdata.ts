import { buildCollectibleImagesStack, buildTokenImagesStack } from 'lib/images-uri';
import type { ObjktToken } from 'lib/temple/back/web-widgets/objkt-query';

import type { TagData } from '../../engine/types';

interface ObjktTokenIdentity {
  fa: string;
  tokenId: string;
}

export const mapTokenToTagData = (
  token: ObjktToken | null,
  { fa, tokenId }: ObjktTokenIdentity
): TagData | null => {
  if (!token) return null;
  if (token.flag && token.flag.toLowerCase() !== 'none') return null;

  // token.fa.contract is the canonical KT1 address, fa may be a collection alias
  const contract = token.fa?.contract ?? fa;

  const stack = buildCollectibleImagesStack({
    name: token.name ?? '',
    symbol: '',
    decimals: 0,
    address: contract,
    id: tokenId,
    artifactUri: token.artifact_uri ?? undefined,
    displayUri: token.display_uri ?? undefined,
    thumbnailUri: token.thumbnail_uri ?? undefined
  });

  const iconUrl =
    stack[0] ?? buildTokenImagesStack(token.thumbnail_uri ?? token.display_uri ?? token.artifact_uri ?? undefined)[0];

  const label = token.name?.trim() ?? '';

  if (!label && !iconUrl) return null;

  return {
    iconUrl: iconUrl ?? '',
    label,
    href: `https://objkt.com/tokens/${contract}/${tokenId}`,
    raw: token
  };
};
