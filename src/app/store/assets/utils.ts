import { fetchTokensMetadata, isKnownChainId, TokenMetadataResponse } from 'lib/apis/temple';
import { fetchTzktAccountAssets } from 'lib/apis/tzkt';
import { TzktAccountAsset } from 'lib/apis/tzkt/types';
import { toTokenSlug } from 'lib/assets';
import { isCollectible } from 'lib/metadata';

import type { MetadataRecords } from '../tokens-metadata/state';

export const loadAccountTokens = (account: string, chainId: string, knownMeta: MetadataRecords) =>
  Promise.all([
    // Fetching assets known to be FTs, not checking metadata
    fetchTzktAccountAssets(account, chainId, true).then(data => finishAssetsLoading(data, chainId, knownMeta)),
    // Fetching unknowns only, checking metadata to filter for FTs
    fetchTzktAccountAssets(account, chainId, null).then(data => finishAssetsLoading(data, chainId, knownMeta, true))
  ]).then(
    ([data1, data2]) => mergeLoadedAssetsData(data1, data2),
    error => {
      console.error(error);
      throw error;
    }
  );

export const loadAccountCollectibles = (account: string, chainId: string, knownMeta: MetadataRecords) =>
  Promise.all([
    // Fetching assets known to be NFTs, not checking metadata
    fetchTzktAccountAssets(account, chainId, false).then(data => finishCollectiblesLoading(data, chainId)),
    // Fetching unknowns only, checking metadata to filter for NFTs
    fetchTzktAccountAssets(account, chainId, null).then(data => finishCollectiblesLoading(data, chainId, knownMeta))
  ]).then(
    ([data1, data2]) => mergeLoadedAssetsData(data1, data2),
    error => {
      console.error(error);
      throw error;
    }
  );

/**
 * @arg fungibleByMetaCheck // Leave `undefined` to not check for assets fungibility
 */
const finishAssetsLoading = async (
  data: TzktAccountAsset[],
  chainId: string,
  knownMeta: MetadataRecords,
  fungibleByMetaCheck?: boolean
) => {
  const slugsWithoutMeta = data.reduce<string[]>((acc, curr) => {
    const slug = tzktAssetToTokenSlug(curr);
    return knownMeta[slug] ? acc : acc.concat(slug);
  }, []);

  const newMetadatas = isKnownChainId(chainId)
    ? await fetchTokensMetadata(chainId, slugsWithoutMeta).catch(err => {
        console.error(err);
      })
    : null;

  const slugs: string[] = [];
  const balances: StringRecord = {};
  const newMeta: Record<string, TokenMetadataResponse> = {};

  for (const asset of data) {
    const slug = tzktAssetToTokenSlug(asset);
    const metadataOfNew = newMetadatas?.[slugsWithoutMeta.indexOf(slug)];

    if (typeof fungibleByMetaCheck === 'boolean') {
      const metadata = knownMeta[slug] || metadataOfNew;

      if (!metadata) continue;
      if (isCollectible(metadata)) {
        if (fungibleByMetaCheck === true) continue;
      } else if (fungibleByMetaCheck === false) continue;
    }

    slugs.push(slug);
    balances[slug] = asset.balance;
    if (metadataOfNew) newMeta[slug] = metadataOfNew;
  }

  return { slugs, balances, newMeta };
};

/**
 * @arg knownMeta // Leave `undefined` to not check for assets fungibility
 */
const finishCollectiblesLoading = async (data: TzktAccountAsset[], chainId: string, knownMeta?: MetadataRecords) => {
  const slugsWithoutMeta = knownMeta
    ? data.reduce<string[]>((acc, curr) => {
        const slug = tzktAssetToTokenSlug(curr);
        return knownMeta[slug] ? acc : acc.concat(slug);
      }, [])
    : [];

  const newMetadatas = isKnownChainId(chainId)
    ? await fetchTokensMetadata(chainId, slugsWithoutMeta).catch(err => {
        console.error(err);
      })
    : null;

  const slugs: string[] = [];
  const balances: StringRecord = {};
  const newMeta: Record<string, TokenMetadataResponse> = {};

  for (const asset of data) {
    const slug = tzktAssetToTokenSlug(asset);

    if (knownMeta) {
      const metadataOfNew = newMetadatas?.[slugsWithoutMeta.indexOf(slug)];
      const metadata = knownMeta[slug] || metadataOfNew;

      if (!metadata || !isCollectible(metadata)) continue;

      if (metadataOfNew) newMeta[slug] = metadataOfNew;
    }

    slugs.push(slug);
    balances[slug] = asset.balance;
  }

  return { slugs, balances, newMeta };
};

interface LoadedAssetsData {
  slugs: string[];
  balances: StringRecord;
  newMeta: Record<string, TokenMetadataResponse>;
}

const mergeLoadedAssetsData = (data1: LoadedAssetsData, data2: LoadedAssetsData) => ({
  slugs: data1.slugs.concat(data2.slugs),
  balances: { ...data1.balances, ...data2.balances },
  newMeta: { ...data1.newMeta, ...data2.newMeta }
});

const tzktAssetToTokenSlug = ({ token }: TzktAccountAsset) => toTokenSlug(token.contract.address, token.tokenId);
