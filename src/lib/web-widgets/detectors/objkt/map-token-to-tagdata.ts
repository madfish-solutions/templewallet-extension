import type { ObjktToken } from 'lib/temple/back/web-widgets/objkt-query';
import { isTruthy } from 'lib/utils';
import { buildObjktAssetUrls, buildObjktTokenThumbnailUrl } from 'lib/utils/objkt-cdn';

import type { TagData } from '../../engine/types';

interface ObjktTokenIdentity {
  fa: string;
  tokenId: string;
}

const buildIconUrlFromMediaUris = ({ thumbnail_uri, display_uri }: ObjktToken) =>
  [thumbnail_uri, display_uri]
    .filter(isTruthy)
    .flatMap(uri => buildObjktAssetUrls(uri, 'artifact'))
    .at(0) ?? '';

export const mapTokenToTagData = (token: ObjktToken | null, { fa, tokenId }: ObjktTokenIdentity): TagData | null => {
  if (!token) return null;
  if (token.flag && token.flag.toLowerCase() !== 'none') return null;

  // token.fa.contract is the canonical KT1 address, fa may be a collection alias
  const contract = token.fa?.contract ?? fa;

  const iconUrl = token.fa ? buildObjktTokenThumbnailUrl(token.fa.contract, tokenId) : buildIconUrlFromMediaUris(token);
  const label = token.name?.trim() ?? '';

  if (!label && !iconUrl) return null;

  return {
    kind: 'objkt',
    iconUrl,
    label,
    href: `https://objkt.com/tokens/${contract}/${tokenId}`,
    raw: token
  };
};
