import { OpKind, TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { GAS_TOKEN_SLUG, toTokenSlug } from 'lib/assets';
import { AssetMetadataBase } from 'lib/metadata';
import { loadContract } from 'lib/temple/contract';
import { TEZ_TOKEN_SLUG } from 'lib/temple/front';
import { isValidContractAddress } from 'lib/temple/helpers';

import { detectTokenStandard } from './tokenStandard';
import { Asset, Token, FA2Token } from './types';

export async function toTransferParams(
  tezos: TezosToolkit,
  assetSlug: string,
  assetMetadata: AssetMetadataBase | nullish,
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
    const contract = await loadContract(tezos, asset.contract);
    const pennyAmount = new BigNumber(amount).times(10 ** (assetMetadata?.decimals ?? 0)).toFixed();
    return isFA2Token(asset)
      ? {
          kind: OpKind.TRANSACTION,
          to: contract.address,
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
      : contract.methods.transfer(fromPkh, toPkh, pennyAmount).toTransferParams();
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

export function toAssetSlug(contract: string, id: BigNumber.Value = 0) {
  return contract === GAS_TOKEN_SLUG ? GAS_TOKEN_SLUG : toTokenSlug(contract, id);
}

export function isFA2Asset(asset: Asset): asset is FA2Token {
  return isGasAsset(asset) ? false : typeof asset.id !== 'undefined';
}

export function isFA2Token(token: Token): token is FA2Token {
  return typeof token.id !== 'undefined';
}

export function isTezAsset(asset: Asset | string): asset is typeof TEZ_TOKEN_SLUG {
  return isGasAsset(asset);
}

export function isGasAsset(asset: Asset | string): asset is typeof GAS_TOKEN_SLUG {
  return asset === GAS_TOKEN_SLUG;
}

export function toPenny(metadata: AssetMetadataBase | nullish) {
  return new BigNumber(1).div(10 ** (metadata?.decimals ?? 0));
}
