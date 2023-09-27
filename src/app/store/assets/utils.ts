import { forkJoin, map } from 'rxjs';

import { fetchTokensMetadata, isKnownChainId, TokenMetadataResponse } from 'lib/apis/temple';
import { fetchTzktAccountAssets, TzktAssetWithMeta, TzktAssetWithNoMeta, TzktTokenWithMeta } from 'lib/apis/tzkt';
import { toTokenSlug } from 'lib/assets';
import { isCollectible } from 'lib/metadata';

export const loadAccountTokens = (account: string, chainId: string) =>
  Promise.all([
    fetchTzktAccountAssets(account, chainId, true),
    loadNoMetaOnTzktAccountAssets(account, chainId, true)
  ]).then(
    ([data1, data2]) => buildLoadAssetsResponse(data1, data2),
    error => {
      console.error(error);
      throw error;
    }
  );

export const loadAccountCollectibles = (account: string, chainId: string) =>
  Promise.all([
    fetchTzktAccountAssets(account, chainId, false),
    loadNoMetaOnTzktAccountAssets(account, chainId, false)
  ]).then(
    ([data1, data2]) => buildLoadAssetsResponse(data1, data2),
    error => {
      console.error(error);
      throw error;
    }
  );

export const loadAccountCollectibles$ = (account: string, chainId: string) =>
  forkJoin([
    fetchTzktAccountAssets(account, chainId, false),
    loadNoMetaOnTzktAccountAssets(account, chainId, false)
  ]).pipe(map(([data1, data2]) => buildLoadAssetsResponse(data1, data2)));

interface NoMetaOnTzktAsset {
  slug: string;
  tzktAsset: TzktAssetWithNoMeta;
  metadata: TokenMetadataResponse;
}

const loadNoMetaOnTzktAccountAssets = async (account: string, chainId: string, fungible: boolean) => {
  if (!isKnownChainId(chainId)) return [];

  const data = await fetchTzktAccountAssets(account, chainId, null);
  const slugs = data.map(t => toTokenSlug(t.token.contract.address, t.token.tokenId));

  const metadatas = await fetchTokensMetadata(chainId, slugs);

  return slugs.reduce<NoMetaOnTzktAsset[]>((acc, slug, i) => {
    const metadata = metadatas[i];

    if (!metadata) return acc;
    if (fungible) {
      if (isCollectible(metadata)) return acc;
    } else if (!isCollectible(metadata)) return acc;

    const tzktAsset = data[i] as TzktAssetWithNoMeta;

    return acc.concat({ slug, tzktAsset, metadata });
  }, []);
};

const buildLoadAssetsResponse = (data1: TzktAssetWithMeta[], data2: NoMetaOnTzktAsset[]) => {
  const slugs: string[] = [];
  const tzktAssetsWithMeta: Record<string, TzktTokenWithMeta> = {};
  const metadatas: Record<string, TokenMetadataResponse> = {};
  const balances: StringRecord = {};

  for (const asset of data1) {
    const { token } = asset;
    const slug = toTokenSlug(token.contract.address, token.tokenId);

    slugs.push(slug);
    tzktAssetsWithMeta[slug] = token;
    balances[slug] = asset.balance;
  }

  for (const { slug, metadata, tzktAsset } of data2) {
    slugs.push(slug);
    metadatas[slug] = metadata;
    balances[slug] = tzktAsset.balance;
  }

  return { slugs, tzktAssetsWithMeta, metadatas, balances };
};
