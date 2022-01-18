import { TezosToolkit } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

import { ROUTING_FEE_ADDRESS } from '../config';
import { Trade } from '../interface/trade.interface';
import { loadAssetContract } from './asset.utils';
import { getTradeInputOperation } from './best-trade.utils';

export const getRoutingFeeTransferParams = async (
  inputTokenMutezAmount: BigNumber | undefined,
  trade: Trade,
  senderPublicKeyHash: string,
  tezos: TezosToolkit
) => {
  const tradeInputOperation = getTradeInputOperation(trade);

  if (inputTokenMutezAmount && tradeInputOperation) {
    const feeAmount = inputTokenMutezAmount.minus(tradeInputOperation.aTokenAmount);

    if (tradeInputOperation.aTokenSlug === 'tez') {
      return [
        {
          amount: feeAmount.toNumber(),
          to: ROUTING_FEE_ADDRESS,
          mutez: true
        }
      ];
    }

    const assetContract = await loadAssetContract(tradeInputOperation.aTokenSlug, tezos);

    if (assetContract) {
      if (assetContract.standard === 'fa1.2') {
        return [
          assetContract.contract.methods
            .transfer(senderPublicKeyHash, ROUTING_FEE_ADDRESS, feeAmount)
            .toTransferParams({ mutez: true })
        ];
      }
      if (assetContract.standard === 'fa2') {
        return [
          assetContract.contract.methods
            .transfer([
              {
                from_: senderPublicKeyHash,
                txs: [
                  {
                    to_: ROUTING_FEE_ADDRESS,
                    token_id: assetContract.assetId,
                    amount: feeAmount
                  }
                ]
              }
            ])
            .toTransferParams({ mutez: true })
        ];
      }
    }
  }

  return [];
};
