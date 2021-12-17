import { TezosToolkit } from '@taquito/taquito';

import { DexTypeEnum } from '../../enums/dex-type.enum';
import { DexPairInterface } from '../../interfaces/dex-pair.interface';
import { toTokenSlug } from '../../utils/asset.utils';
import { getContract } from '../../utils/contract.utils';
import { LIQUIDITY_BAKING_DEX_ADDRESSES } from './dex-addresses.array';
import { LiquidityBakingDexStorageInterface } from './dex-storage.interface';

export const getLiquidityBakingDexPairs = (tezos: TezosToolkit): Promise<DexPairInterface[]> =>
  Promise.all(
    LIQUIDITY_BAKING_DEX_ADDRESSES.map(async (dexAddress): Promise<DexPairInterface> => {
      const dexContract = await getContract(dexAddress, tezos);

      const storage = await dexContract.storage<LiquidityBakingDexStorageInterface>();

      return {
        dexType: DexTypeEnum.LiquidityBaking,
        dexContract,
        aTokenSlug: 'tez',
        bTokenSlug: toTokenSlug(storage.tokenAddress)
      };
    })
  );
