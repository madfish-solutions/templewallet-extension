import { EMPTY_FROZEN_OBJ } from 'lib/utils';

import { useSelector } from '../../root-state.selector';

import { AssetSlugStoredAssetRecord, ChainIdTokenSlugsAssetsRecord } from './state';

export const useEvmStoredTokensRecordSelector = () => useSelector(state => state.evmAssets.tokens);

export const useRawEvmAccountTokensSelector = (publicKeyHash: HexString): ChainIdTokenSlugsAssetsRecord =>
  useSelector(state => state.evmAssets.tokens[publicKeyHash]) ?? EMPTY_FROZEN_OBJ;

export const useRawEvmChainAccountTokensSelector = (
  publicKeyHash: HexString,
  chainId: number
): AssetSlugStoredAssetRecord =>
  useSelector(state => state.evmAssets.tokens[publicKeyHash]?.[chainId]) ?? EMPTY_FROZEN_OBJ;

export const useEvmStoredCollectiblesRecordSelector = () => useSelector(state => state.evmAssets.collectibles);

export const useRawEvmAccountCollectiblesSelector = (publicKeyHash: HexString): ChainIdTokenSlugsAssetsRecord =>
  useSelector(state => state.evmAssets.collectibles[publicKeyHash]) ?? EMPTY_FROZEN_OBJ;

export const useRawEvmChainAccountCollectiblesSelector = (
  publicKeyHash: HexString,
  chainId: number
): AssetSlugStoredAssetRecord =>
  useSelector(state => state.evmAssets.collectibles[publicKeyHash]?.[chainId]) ?? EMPTY_FROZEN_OBJ;
