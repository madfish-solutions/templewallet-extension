import { TezosToolkit } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';
import { getTradeInputOperation, loadAssetContract, Trade, TokenStandardEnum } from 'swap-router-sdk';

import { checkIsPromotionTime } from '../../../app/layouts/PageLayout/utils/checkIsPromotionTime';
import { ROUTING_FEE_ADDRESS } from '../config';

export const getRoutingFeeTransferParams = async (
  inputTokenMutezAmount: BigNumber | undefined,
  trade: Trade,
  senderPublicKeyHash: string,
  tezos: TezosToolkit
) => {
  const isPromotionTime = checkIsPromotionTime();

  const tradeInputOperation = getTradeInputOperation(trade);

  if (inputTokenMutezAmount && tradeInputOperation && !isPromotionTime) {
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
      if (assetContract.standard === TokenStandardEnum.FA1_2) {
        return [
          assetContract.contract.methods
            .transfer(senderPublicKeyHash, ROUTING_FEE_ADDRESS, feeAmount)
            .toTransferParams({ mutez: true })
        ];
      }
      if (assetContract.standard === TokenStandardEnum.FA2) {
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
