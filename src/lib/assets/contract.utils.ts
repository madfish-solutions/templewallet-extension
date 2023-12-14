import { OpKind, TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import type { AssetMetadataBase } from 'lib/metadata';
import { loadContract } from 'lib/temple/contract';
import { isValidContractAddress, tokensToAtoms } from 'lib/temple/helpers';

import { detectTokenStandard } from './standards';
import type { Asset } from './types';
import { fromAssetSlug } from './utils';

import { isFA2Token, isTezAsset } from './index';

export const toTransferParams = async (
  tezos: TezosToolkit,
  assetSlug: string,
  assetMetadata: AssetMetadataBase,
  fromPkh: string,
  toPkh: string,
  amount: BigNumber.Value
) => {
  const asset = await fromAssetSlugWithStandardDetect(tezos, assetSlug);

  if (isTezAsset(asset)) {
    return {
      to: toPkh,
      amount: amount as any
    };
  }

  const contract = await loadContract(tezos, asset.contract);
  const pennyAmount = tokensToAtoms(amount, assetMetadata.decimals).toFixed();

  if (isFA2Token(asset))
    /*
     * `contract.methods.transfer` is not working for Rarible contracts.
     * E.g. `KT18pVpRXKPY2c4U2yFEGSH3ZnhB2kL8kwXS_${63714 | 58076}`
     */
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

export const fromAssetSlugWithStandardDetect = async (tezos: TezosToolkit, slug: string): Promise<Asset> => {
  if (isTezAsset(slug)) return slug;

  const [contractAddress, tokenIdStr] = fromAssetSlug(slug);

  if (!isValidContractAddress(contractAddress)) {
    throw new Error('Invalid contract address');
  }

  const tokenStandard = await detectTokenStandard(tezos, contractAddress);

  return {
    contract: contractAddress,
    id: tokenStandard === 'fa2' ? tokenIdStr ?? '0' : undefined
  };
};
