import { TezosToolkit } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';
import { loadAssetContract, Trade, TokenStandardEnum, getTradeOutputOperation } from 'swap-router-sdk';

import { ROUTING_FEE_ADDRESS, ROUTING_FEE_RATIO } from '../config';

export const getRoutingFeeTransferParams = async (
  outputTokenMutezAmount: BigNumber | undefined,
  trade: Trade,
  senderPublicKeyHash: string,
  tezos: TezosToolkit
) => {
  console.log(trade);
  const tradeOutputOperation = getTradeOutputOperation(trade);
  console.log(tradeOutputOperation);

  if (outputTokenMutezAmount && tradeOutputOperation) {
    const feeAmount = outputTokenMutezAmount.minus(
      tradeOutputOperation.bTokenAmount.multipliedBy(ROUTING_FEE_RATIO).dividedToIntegerBy(1)
    );

    if (tradeOutputOperation.bTokenSlug === 'tez') {
      return [
        {
          amount: feeAmount.toNumber(),
          to: ROUTING_FEE_ADDRESS,
          mutez: true
        }
      ];
    }

    const assetContract = await loadAssetContract(tradeOutputOperation.bTokenSlug, tezos);

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
