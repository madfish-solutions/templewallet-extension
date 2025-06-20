import { createAction } from '@reduxjs/toolkit';

import { createActions } from 'lib/store';

import { ChainId, NoCategoryAssetMetadata } from './state';

export type AssetsMetadataInput = Record<ChainId, StringRecord<NoCategoryAssetMetadata | undefined>>;

export interface PutEvmNoCategoryAssetsMetadataPayload {
  records: AssetsMetadataInput;
  associatedAccountPkh: HexString;
}

export const putEvmNoCategoryAssetsMetadataAction = createAction<PutEvmNoCategoryAssetsMetadataPayload>(
  'tezos/no-category-assets-metadata/PUT_MULTIPLE'
);

export const loadNoCategoryEvmAssetsMetadataActions = createActions<
  {
    rpcUrl: string;
    associatedAccountPkh: HexString;
    chainId: number;
    slugs: string[];
  },
  PutEvmNoCategoryAssetsMetadataPayload & { poolsAreEmpty: boolean }
>('evm/no-category-assets-metadata/LOAD');

export const refreshNoCategoryEvmAssetsMetadataActions = createActions<
  { associatedAccountPkh: HexString; rpcUrls: Record<number, string> },
  { records: AssetsMetadataInput; poolsAreEmpty: boolean }
>('evm/no-category-assets-metadata/REFRESH_MULTIPLE');
