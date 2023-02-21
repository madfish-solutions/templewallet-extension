import { TezosToolkit } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';

import { ROUTING_FEE_ADDRESS } from '../constants';

export const getRoutingFeeTransferParams = async (
  token: Route3Token,
  feeAmountAtomic: BigNumber,
  senderPublicKeyHash: string,
  tezos: TezosToolkit
) => {
  if (token.contract === null) {
    return [
      {
        amount: feeAmountAtomic.toNumber(),
        to: ROUTING_FEE_ADDRESS,
        mutez: true
      }
    ];
  }

  const assetContract = await tezos.wallet.at(token.contract);

  if (token.standard === 'fa12') {
    return [
      assetContract.methods
        .transfer(senderPublicKeyHash, ROUTING_FEE_ADDRESS, feeAmountAtomic)
        .toTransferParams({ mutez: true })
    ];
  }
  if (token.standard === 'fa2') {
    return [
      assetContract.methods
        .transfer([
          {
            from_: senderPublicKeyHash,
            txs: [
              {
                to_: ROUTING_FEE_ADDRESS,
                token_id: token.id,
                amount: feeAmountAtomic
              }
            ]
          }
        ])
        .toTransferParams({ mutez: true })
    ];
  }

  return [];
};
