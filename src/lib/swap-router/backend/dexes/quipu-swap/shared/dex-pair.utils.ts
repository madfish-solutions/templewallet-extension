import { TezosToolkit } from '@taquito/taquito';

import { DexTypeEnum } from '../../../enums/dex-type.enum';
import { DexPairInterface } from '../../../interfaces/dex-pair.interface';
import { getContract } from '../../../utils/contract.utils';
import { QuipuSwapDexTokenType } from './dex-token.type';
import { quipuSwapDexTokenToTokenSlug } from './dex-token.utils';
import { QuipuSwapFactoryStorage } from './factory-storage.interface';

export const getQuipuSwapDexPairs = async (
  factoryAddress: string,
  tezos: TezosToolkit
): Promise<DexPairInterface[]> => {
  const factoryContract = await getContract(factoryAddress, tezos);

  const storage = await factoryContract.storage<QuipuSwapFactoryStorage>();

  const counter = storage.counter.toNumber();
  const tokenList = storage.token_list;
  const tokenToExchange = storage.token_to_exchange;

  return Promise.all(
    new Array(counter).fill(0).map(async (_, tokenIndex): Promise<DexPairInterface | undefined> => {
      const token = await tokenList.get<QuipuSwapDexTokenType>(tokenIndex);

      if (token !== undefined) {
        const dexAddress = await tokenToExchange.get<string>(token);

        if (dexAddress !== undefined) {
          const dexContract = await getContract(dexAddress, tezos);

          return {
            dexType: DexTypeEnum.QuipuSwap,
            dexContract,
            aTokenSlug: 'tez',
            bTokenSlug: quipuSwapDexTokenToTokenSlug(token)
          };
        }
      }

      return undefined;
    })
  ).then(result => result.filter((item): item is DexPairInterface => item !== undefined));
};
