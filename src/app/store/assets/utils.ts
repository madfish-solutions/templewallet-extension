import { fetchTokensMetadata, isKnownChainId } from 'lib/apis/temple';
import { fetchTzktAccountTokens } from 'lib/apis/tzkt';
import { toTokenSlug } from 'lib/assets';

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
    fetchTzktAccountTokens(account, chainId),
    fetchNoMetaOnTzktAccountTokens(account, chainId)
  ]).catch(error => {
    console.error(error);
    throw error;
  });

  return data1
    .map(t => ({
      slug: toTokenSlug(t.token.contract.address, t.token.tokenId),
      decimals: Number(t.token.metadata!.decimals!),
      symbol: t.token.metadata!.symbol,
      name: t.token.metadata!.name,
      balance: t.balance
    }))
    .concat(data2);
};

const fetchNoMetaOnTzktAccountTokens = async (account: string, chainId: string) => {
  if (!isKnownChainId(chainId)) return [];

  const data = await fetchTzktAccountTokens(account, chainId, true);
  const slugs = data.map(t => toTokenSlug(t.token.contract.address, t.token.tokenId));

  const metadatas = await fetchTokensMetadata(chainId, slugs);

  return metadatas.reduce<AccountTokenResponse[]>((acc, curr, i) => {
    if (!curr || curr.artifactUri != null) return acc;

    return acc.concat({
      slug: slugs[i]!,
      decimals: curr.decimals,
      symbol: curr.symbol ?? '',
      name: curr.name ?? '',
      balance: data[i]!.balance
    });
  }, []);
};
