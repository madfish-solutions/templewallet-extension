import { TezosToolkit } from '@taquito/taquito';

import { DexTypeEnum } from '../../dex-type.enum';
import { PairInterface } from '../../pair.interface';
import { getContract } from '../../utils/contract.utils';
import { QuipuSwapFactoryStorage } from './factory-storage.interface';
import { QuipuSwapFactoryTokenType } from './factory-token.type';
import { quipuSwapFactoryTokenToTokenType } from './factory-token.utils';

export const getQuipuSwapFactoryPairs = async (
  factoryAddress: string,
  tezos: TezosToolkit
): Promise<PairInterface[]> => {
  const factoryContract = await getContract(factoryAddress, tezos);

  const storage = await factoryContract.storage<QuipuSwapFactoryStorage>();

  const counter = storage.counter.toNumber();
  const tokenList = storage.token_list;
  const tokenToExchange = storage.token_to_exchange;

  return Promise.all(
    new Array(counter).fill(0).map(async (_, tokenIndex): Promise<PairInterface | undefined> => {
      const token = await tokenList.get<QuipuSwapFactoryTokenType>(tokenIndex);

      if (token !== undefined) {
        const dexAddress = await tokenToExchange.get<string>(token);

        if (dexAddress !== undefined) {
          const dexContract = await getContract(dexAddress, tezos);

          return {
            aToken: 'tez',
            bToken: quipuSwapFactoryTokenToTokenType(token),
            dexType: DexTypeEnum.QuipuSwap,
            dexContract
          };
        }
      }

      return undefined;
    })
  ).then(result => result.filter((item): item is PairInterface => item !== undefined));
};
