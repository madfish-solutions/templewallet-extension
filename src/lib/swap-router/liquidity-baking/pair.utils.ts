import { TezosToolkit } from '@taquito/taquito';

import { DexTypeEnum } from '../dex-type.enum';
import { PairInterface } from '../pair.interface';
import { getContract } from '../utils/contract.utils';
import { LIQUIDITY_BAKING_DEX_ADDRESSES } from './dex-addresses.array';
import { LiquidityBakingDexStorageInterface } from './dex-storage.interface';
import { liquidityBakingDexTokenToTokenType } from './dex-token.utils';

export const getLiquidityBakingPairs = (tezos: TezosToolkit): Promise<PairInterface[]> =>
  Promise.all(
    LIQUIDITY_BAKING_DEX_ADDRESSES.map(async (dexAddress): Promise<PairInterface> => {
      const dexContract = await getContract(dexAddress, tezos);

      const storage = await dexContract.storage<LiquidityBakingDexStorageInterface>();

      return {
        aToken: { address: 'tez' },
        bToken: liquidityBakingDexTokenToTokenType(storage.tokenAddress),
        dexType: DexTypeEnum.LiquidityBaking,
        dexContract
      };
    })
  );
