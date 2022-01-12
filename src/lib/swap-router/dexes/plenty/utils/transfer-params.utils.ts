import { TezosToolkit } from '@taquito/taquito';

import { TradeOperation } from '../../../interface/trade.interface';
import { getContract } from '../../../utils/contract.utils';
import { PlentyContractAbstraction } from '../interfaces/plenty.contract-abstraction.interface';

export const getPlentyTransferParams = async (
  tradeOperation: TradeOperation,
  senderPublicKeyHash: string,
  tezos: TezosToolkit
) => {
  const contract = await getContract<PlentyContractAbstraction>(tradeOperation.dexAddress, tezos);

  const [outputTokenAddress, outputTokenId = '0'] = tradeOperation.bTokenSlug.split('_');

  return contract.methods
    .Swap(
      tradeOperation.bTokenAmount,
      senderPublicKeyHash,
      outputTokenAddress,
      outputTokenId,
      tradeOperation.aTokenAmount
    )
    .toTransferParams({ mutez: true });
};
