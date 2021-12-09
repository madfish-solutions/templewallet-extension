import { TezosToolkit } from '@taquito/taquito';

import { DexTypeEnum } from '../dex-type.enum';
import { PairInterface } from '../pair.interface';
import { getContract } from '../utils/contract.utils';
import { PLENTY_DEX_ADDRESSES } from './dex-addresses.array';
import { PlentyDexStorageInterface } from './dex-storage.interface';
import { plentyDexTokenToTokenType } from './dex-token.utils';

export const getPlentyPairs = (tezos: TezosToolkit): Promise<PairInterface[]> => {
  return Promise.all(
    PLENTY_DEX_ADDRESSES.map(async (dexAddress): Promise<PairInterface> => {
      const dexContract = await getContract(dexAddress, tezos);

      const storage = await dexContract.storage<PlentyDexStorageInterface>();

      return {
        aToken: plentyDexTokenToTokenType(storage.token1Address, storage.token1Check, storage.token1Id),
        bToken: plentyDexTokenToTokenType(storage.token2Address, storage.token2Check, storage.token2Id),
        dexType: DexTypeEnum.Plenty,
        dexAddress
      };
    })
  );
};
