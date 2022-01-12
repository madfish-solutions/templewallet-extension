import { TezosToolkit } from '@taquito/taquito';

import { detectTokenStandard } from '../../temple/assets';
import { Fa12AssetContractAbstraction } from '../interface/fa1-2-asset.contract-abstraction.interface';
import { Fa2AssetContractAbstraction } from '../interface/fa2-asset.contract-abstraction.interface';

export const loadAssetContract = async (assetSlug: string, tezos: TezosToolkit) => {
  const [assetAddress, assetId = '0'] = assetSlug.split('_');

  const contract = await tezos.contract.at(assetAddress);
  const standard = await detectTokenStandard(tezos, contract);

  if (standard === 'fa1.2') {
    return {
      standard,
      contract: contract as Fa12AssetContractAbstraction
    };
  }

  if (standard === 'fa2') {
    return {
      standard,
      assetId,
      contract: contract as Fa2AssetContractAbstraction
    };
  }

  return undefined;
};
