import { fetchTokensMetadata, isKnownChainId, TokenMetadataResponse } from 'lib/apis/temple';
import { fetchTzktAccountAssets, TzktAssetWithNoMeta, TzktTokenWithMeta } from 'lib/apis/tzkt';
import { toTokenSlug } from 'lib/assets';
import { isCollectible } from 'lib/metadata';

/**
 * @deprecated // (do)
 * Currently, only slugs are used
 */
interface AccountTokenResponse {
  slug: string;
  // std: 'fa-2' | 'fa-1.2';
  decimals: number;
  symbol: string;
  name: string;
  /** Atomic */
  balance: string;
}

export const fetchAccountTokens = async (account: string, chainId: string): Promise<AccountTokenResponse[]> => {
  const [data1, data2] = await Promise.all([
    fetchTzktAccountAssets(account, chainId, true),
    fetchNoMetaOnTzktAccountAssets(account, chainId, true)
  ]).catch(error => {
    console.error(error);
    throw error;
  });

  const tokens1 = data1.map(({ token, balance }) => {
    const metadata = token.metadata!;

    return {
      slug: toTokenSlug(token.contract.address, token.tokenId),
      decimals: Number(metadata.decimals ?? 0),
      symbol: metadata.symbol,
      name: metadata.name,
      balance
    };
  });

  const tokens2 = data2.map<AccountTokenResponse>(({ slug, tzktAsset, metadata }, i) => ({
    slug,
    decimals: metadata.decimals,
    symbol: metadata.symbol ?? '',
    name: metadata.name ?? '',
    balance: tzktAsset.balance
  }));

  return tokens1.concat(tokens2);
};

export const fetchAccountCollectibles = async (account: string, chainId: string) => {
  const [data1, data2] = await Promise.all([
    fetchTzktAccountAssets(account, chainId, false),
    fetchNoMetaOnTzktAccountAssets(account, chainId, false)
  ]).catch(error => {
    console.error(error);
    throw error;
  });

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

interface NoMetaOnTzktAsset {
  slug: string;
  tzktAsset: TzktAssetWithNoMeta;
  metadata: TokenMetadataResponse;
}

const fetchNoMetaOnTzktAccountAssets = async (account: string, chainId: string, fungible: boolean) => {
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
