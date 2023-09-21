import { fetchTokensMetadata, isKnownChainId } from 'lib/apis/temple';
import { fetchTzktAccountAssets } from 'lib/apis/tzkt';
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
    fetchNoMetaOnTzktAccountTokens(account, chainId)
  ]).catch(error => {
    console.error(error);
    throw error;
  });

  return data1
    .map(({ token, balance }) => {
      const metadata = token.metadata!;

      return {
        slug: toTokenSlug(token.contract.address, token.tokenId),
        decimals: Number(metadata.decimals!),
        symbol: metadata.symbol,
        name: metadata.name,
        balance
      };
    })
    .concat(data2);
};

export const fetchAccountCollectibles = async (account: string, chainId: string): Promise<string[]> => {
  const [data1, data2] = await Promise.all([
    fetchTzktAccountAssets(account, chainId, false),
    fetchNoMetaOnTzktAccountCollectibles(account, chainId)
  ]).catch(error => {
    console.error(error);
    throw error;
  });

  return data1.map(({ token }) => toTokenSlug(token.contract.address, token.tokenId)).concat(data2);
};

const fetchNoMetaOnTzktAccountTokens = async (account: string, chainId: string) => {
  const res = await fetchNoMetaOnTzktAccountAssets(account, chainId);
  if (!res) return [];

  const { slugs, metadatas, data } = res;

  return metadatas.reduce<AccountTokenResponse[]>(
    (acc, metadata, i) =>
      metadata && !isCollectible(metadata)
        ? acc.concat({
            slug: slugs[i]!,
            decimals: metadata.decimals,
            symbol: metadata.symbol ?? '',
            name: metadata.name ?? '',
            balance: data[i]!.balance
          })
        : acc,
    []
  );
};

const fetchNoMetaOnTzktAccountCollectibles = async (account: string, chainId: string) => {
  const res = await fetchNoMetaOnTzktAccountAssets(account, chainId);
  if (!res) return [];

  const { slugs, metadatas } = res;

  return slugs.filter((_, i) => {
    const metadata = metadatas[i];

    return metadata && isCollectible(metadata);
  });
};

const fetchNoMetaOnTzktAccountAssets = async (account: string, chainId: string) => {
  if (!isKnownChainId(chainId)) return null;

  const data = await fetchTzktAccountAssets(account, chainId, null);
  const slugs = data.map(t => toTokenSlug(t.token.contract.address, t.token.tokenId));

  const metadatas = await fetchTokensMetadata(chainId, slugs);

  return { slugs, metadatas, data };
};
