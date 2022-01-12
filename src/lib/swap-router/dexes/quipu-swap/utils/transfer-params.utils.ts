import { TezosToolkit } from '@taquito/taquito';

import { RouteDirectionEnum } from '../../../enum/route-direction.enum';
import { TradeOperation } from '../../../interface/trade.interface';
import { QuipuSwapContractAbstraction } from '../interfaces/quipu-swap.contract-abstraction.interface';

export const getQuipuSwapTransferParams = async (
  tradeOperation: TradeOperation,
  senderPublicKeyHash: string,
  tezos: TezosToolkit
) => {
  const contract = await tezos.contract.at<QuipuSwapContractAbstraction>(tradeOperation.dexAddress);

  if (tradeOperation.direction === RouteDirectionEnum.Direct) {
    return contract.methods
      .tezToTokenPayment(tradeOperation.bTokenAmount, senderPublicKeyHash)
      .toTransferParams({ amount: tradeOperation.aTokenAmount.toNumber(), mutez: true });
  } else {
    return contract.methods
      .tokenToTezPayment(tradeOperation.aTokenAmount, tradeOperation.bTokenAmount, senderPublicKeyHash)
      .toTransferParams({ mutez: true });
  }
};
