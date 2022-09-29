import { useMemo, useState } from 'react';

import { OpKind, TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { useDebounce } from 'use-debounce';

import { loadContract } from 'lib/temple/contract';
import { searchAssets, useAllTokensBaseMetadata } from 'lib/temple/front/assets';
import { isValidContractAddress } from 'lib/temple/helpers';
import type { AssetMetadata } from 'lib/temple/metadata/types';

import { detectTokenStandard } from './tokenStandard';
import { Asset, Token, FA2Token } from './types';

export async function toTransferParams(
  tezos: TezosToolkit,
  assetSlug: string,
  assetMetadata: AssetMetadata | null,
  fromPkh: string,
  toPkh: string,
  amount: BigNumber.Value
) {
  const asset = await fromAssetSlug(tezos, assetSlug);

  if (isTezAsset(asset)) {
    return {
      to: toPkh,
      amount: amount as any
    };
  } else {
    const contact = await loadContract(tezos, asset.contract);
    const pennyAmount = new BigNumber(amount).times(10 ** (assetMetadata?.decimals ?? 0)).toFixed();
    return isFA2Token(asset)
      ? {
          kind: OpKind.TRANSACTION,
          to: contact.address,
          amount: 0,
          parameter: {
            entrypoint: 'transfer',
            value: [
              {
                prim: 'Pair',
                args: [
                  { string: fromPkh },
                  [
                    {
                      prim: 'Pair',
                      args: [
                        { string: toPkh },
                        {
                          prim: 'Pair',
                          args: [{ int: new BigNumber(asset.id).toFixed() }, { int: pennyAmount }]
                        }
                      ]
                    }
                  ]
                ]
              }
            ]
          }
        }
      : contact.methods.transfer(fromPkh, toPkh, pennyAmount).toTransferParams();
  }
}

export async function fromAssetSlug(tezos: TezosToolkit, slug: string): Promise<Asset> {
  if (isTezAsset(slug)) return slug;

  const [contractAddress, tokenIdStr] = slug.split('_');

  if (!isValidContractAddress(contractAddress)) {
    throw new Error('Invalid contract address');
  }

  const tokenStandard = await detectTokenStandard(tezos, contractAddress);

  return {
    contract: contractAddress,
    id: tokenStandard === 'fa2' ? new BigNumber(tokenIdStr ?? 0) : undefined
  };
}

export function fromFa2TokenSlug(slug: string): FA2Token {
  if (isTezAsset(slug)) {
    throw new Error('Only fa2 token slug allowed');
  }
  const [contractAddress, tokenIdStr] = slug.split('_');
  return {
    contract: contractAddress,
    id: new BigNumber(tokenIdStr ?? 0)
  };
}

export function toTokenSlug(contract: string, id: BigNumber.Value = 0) {
  return contract === 'tez' ? 'tez' : `${contract}_${new BigNumber(id).toFixed()}`;
}

export function isFA2Asset(asset: Asset): asset is FA2Token {
  return asset === 'tez' ? false : typeof asset.id !== 'undefined';
}

export function isFA2Token(token: Token): token is FA2Token {
  return typeof token.id !== 'undefined';
}

export function isTezAsset(asset: Asset | string): asset is 'tez' {
  return asset === 'tez';
}

export function toPenny(metadata: AssetMetadata | null) {
  return new BigNumber(1).div(10 ** (metadata?.decimals ?? 0));
}

export function useFilteredAssets(assetSlugs: string[]) {
  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  const [searchValue, setSearchValue] = useState('');
  const [tokenId, setTokenId] = useState<number>();
  const [searchValueDebounced] = useDebounce(tokenId ? toTokenSlug(searchValue, tokenId) : searchValue, 300);

  const filteredAssets = useMemo(
    () => searchAssets(searchValueDebounced, assetSlugs, allTokensBaseMetadata),
    [searchValueDebounced, assetSlugs, allTokensBaseMetadata]
  );

  return {
    filteredAssets,
    searchValue,
    setSearchValue,
    tokenId,
    setTokenId
  };
}
