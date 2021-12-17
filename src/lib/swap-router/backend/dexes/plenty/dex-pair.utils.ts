import { TezosToolkit } from '@taquito/taquito';

import { DexTypeEnum } from '../../enums/dex-type.enum';
import { DexPairInterface } from '../../interfaces/dex-pair.interface';
import { getContract } from '../../utils/contract.utils';
import { PLENTY_DEX_ADDRESSES } from './dex-addresses.array';
import { PlentyDexStorageInterface } from './dex-storage.interface';
import { plentyDexTokenToTokenSlug } from './dex-token.utils';

export const getPlentyDexPairs = (tezos: TezosToolkit): Promise<DexPairInterface[]> =>
  Promise.all(
    PLENTY_DEX_ADDRESSES.map(async (dexAddress): Promise<DexPairInterface> => {
      const dexContract = await getContract(dexAddress, tezos);

      const storage = await dexContract.storage<PlentyDexStorageInterface>();

      return {
        dexType: DexTypeEnum.Plenty,
        dexContract,
        aTokenSlug: plentyDexTokenToTokenSlug(storage.token1Address, storage.token1Check, storage.token1Id),
        bTokenSlug: plentyDexTokenToTokenSlug(storage.token2Address, storage.token2Check, storage.token2Id)
      };
    })
  );
