import { fetchTokensMetadata, isKnownChainId, TokenMetadataResponse } from 'lib/apis/temple';
import { fetchTzktAccountAssets, TzktAccountAsset, TzktAssetWithNoMeta } from 'lib/apis/tzkt';
import { toTokenSlug } from 'lib/assets';
import { isCollectible } from 'lib/metadata';
import { buildTokenMetadataFromFetched, buildTokenMetadataFromTzkt } from 'lib/metadata/utils';

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
      decimals: Number(metadata.decimals!),
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

  const slugs1 = data1.map(({ token }) => toTokenSlug(token.contract.address, token.tokenId));
  const slugs2 = data2.map(({ slug }) => slug);

  const slugs = slugs1.concat(slugs2);

  const metadatas1 = data1.map(({ token }) =>
    buildTokenMetadataFromTzkt(token.metadata!, token.contract.address, Number(token.tokenId))
  );
  const metadatas2 = data2.map(({ metadata }, i) => {
    const [address, id] = slugs2[i]!.split('_');

    return buildTokenMetadataFromFetched(metadata, address, Number(id));
  });
  const metadatas = metadatas1.concat(metadatas2);

  const balances1 = data1.reduce<StringRecord>((acc, asset, i) => {
    const slug = slugs1[i]!;

    return { ...acc, [slug]: asset.balance };
  }, {});
  const balances2 = data2.reduce<StringRecord>((acc, { tzktAsset }, i) => {
    const slug = slugs2[i]!;

    return { ...acc, [slug]: tzktAsset.balance };
  }, {});
  const balances = { ...balances1, ...balances2 };

  return { slugs, metadatas, balances };
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
