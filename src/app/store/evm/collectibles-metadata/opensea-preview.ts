import { previewUrlIsOpenseaHosted } from 'lib/metadata/collectible-media';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { patchRetiredSeadnImageUrl } from 'lib/metadata/utils';
import { parseMediaUri } from 'lib/utils/ipfs';

/**
 * True when the preview is missing or only good enough as a last resort: an IPFS URL, including
 * `ipfs.covalenthq.com`, or an `i.seadn.io` URL that cannot be rewritten.
 * A missing preview is enough when the playable file is already on OpenSea's CDN.
 */
const imageUrlIsLastResort = (url: string) => {
  const patched = patchRetiredSeadnImageUrl(url);
  if (!patched) return true;

  return Boolean(parseMediaUri(patched).ipfsAware.ipfs);
};

export const collectiblePreviewIsLastResort = (metadata: EvmCollectibleMetadata | undefined) => {
  const url = metadata?.images?.[0] ?? metadata?.image;
  if (!url) return !previewUrlIsOpenseaHosted(metadata?.artifactUrl);

  return imageUrlIsLastResort(url);
};

/** A Goldrush CDN image can sit behind an OpenSea IPFS url. Show the preferred one first. */
export const promotePreferredPreview = (metadata: EvmCollectibleMetadata): EvmCollectibleMetadata => {
  const images = metadata.images ?? (metadata.image ? [metadata.image] : []);
  const preferredIndex = images.findIndex(url => !imageUrlIsLastResort(url));
  if (preferredIndex <= 0) return metadata;

  const preferred = images[preferredIndex];

  return {
    ...metadata,
    image: preferred,
    images: [preferred, ...images.filter((_, index) => index !== preferredIndex)]
  };
};
