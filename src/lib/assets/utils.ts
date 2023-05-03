import { OpKind, TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { AssetMetadataBase } from 'lib/metadata';
import { loadContract } from 'lib/temple/contract';
import { isValidContractAddress } from 'lib/temple/helpers';

import { isFA2Token, isTezAsset } from './index';
import { detectTokenStandard } from './standards';
import { Asset, FA2Token } from './types';

export const toTransferParams = async (
  tezos: TezosToolkit,
  assetSlug: string,
  assetMetadata: AssetMetadataBase | nullish,
  fromPkh: string,
  toPkh: string,
  amount: BigNumber.Value
) => {
  const asset = await fromAssetSlug(tezos, assetSlug);

  if (isTezAsset(asset)) {
    return {
      to: toPkh,
      amount: amount as any
    };
  }

  const contract = await loadContract(tezos, asset.contract);
  const pennyAmount = new BigNumber(amount).times(10 ** (assetMetadata?.decimals ?? 0)).toFixed();

  if (isFA2Token(asset))
    return {
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
    };

  return contract.methods.transfer(fromPkh, toPkh, pennyAmount).toTransferParams();
};

export const fromAssetSlug = async (tezos: TezosToolkit, slug: string): Promise<Asset> => {
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
};

export const fromFa2TokenSlug = (slug: string): FA2Token => {
  if (isTezAsset(slug)) {
    throw new Error('Only fa2 token slug allowed');
  }

  const [contractAddress, tokenIdStr] = slug.split('_');

  return {
    contract: contractAddress,
    id: new BigNumber(tokenIdStr ?? 0)
  };
};
