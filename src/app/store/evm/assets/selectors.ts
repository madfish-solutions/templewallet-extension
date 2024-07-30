import { useSelector } from 'app/store/root-state.selector';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';

import { AssetSlugStoredAssetRecord, ChainIdTokenSlugsAssetsRecord, StoredEvmAsset } from './state';

export const useEvmStoredTokensRecordSelector = () => useSelector(state => state.evmAssets.tokens);

export const useRawEvmAccountTokensSelector = (publicKeyHash: HexString): ChainIdTokenSlugsAssetsRecord =>
  useSelector(state => state.evmAssets.tokens[publicKeyHash]) ?? EMPTY_FROZEN_OBJ;

export const useRawEvmChainAccountTokensSelector = (
  publicKeyHash: HexString,
  chainId: number
): AssetSlugStoredAssetRecord =>
  useSelector(state => state.evmAssets.tokens[publicKeyHash]?.[chainId]) ?? EMPTY_FROZEN_OBJ;

export const useStoredEvmTokenSelector = (
  publicKeyHash: HexString,
  chainId: number,
  assetSlug: string
): StoredEvmAsset | undefined => useSelector(state => state.evmAssets.tokens[publicKeyHash]?.[chainId]?.[assetSlug]);

export const useEvmStoredCollectiblesRecordSelector = () => useSelector(state => state.evmAssets.collectibles);

export const useRawEvmAccountCollectiblesSelector = (publicKeyHash: HexString): ChainIdTokenSlugsAssetsRecord =>
  useSelector(state => state.evmAssets.collectibles[publicKeyHash]) ?? EMPTY_FROZEN_OBJ;

export const useRawEvmChainAccountCollectiblesSelector = (
  publicKeyHash: HexString,
  chainId: number
): AssetSlugStoredAssetRecord =>
  useSelector(state => state.evmAssets.collectibles[publicKeyHash]?.[chainId]) ?? EMPTY_FROZEN_OBJ;

export const useStoredEvmCollectibleSelector = (
  publicKeyHash: HexString,
  chainId: number,
  assetSlug: string
): StoredEvmAsset | undefined =>
  useSelector(state => state.evmAssets.collectibles[publicKeyHash]?.[chainId]?.[assetSlug]);
