import { formatCollectibleUri, formatImgUri, sanitizeImgUri } from 'lib/image-uri';
import { useRetryableSWR } from 'lib/swr';
import { fromAssetSlug } from 'lib/temple/assets';
import { useAssetMetadata, getThumbnailUri, useNetwork, useTezos } from 'lib/temple/front';

const useImageLoader = (assetSlug: string): string => {
  const tezos = useTezos();
  const network = useNetwork();
  const collectibleMetadata = useAssetMetadata(assetSlug) ?? {};
  const asset = useRetryableSWR(['asset', assetSlug, tezos.checksum], () => fromAssetSlug(tezos, assetSlug), {
    suspense: true
  }).data!;
  if (asset === 'tez') {
    return getThumbnailUri(collectibleMetadata) ?? '';
  }
  const assetId = asset.id ? asset.id.toString() : '0';
  if (network.type === 'main') {
    return formatCollectibleUri(asset.contract, assetId);
  } else {
    return sanitizeImgUri(formatImgUri(collectibleMetadata.displayUri || collectibleMetadata.artifactUri), 512, 512);
  }
};

export default useImageLoader;
