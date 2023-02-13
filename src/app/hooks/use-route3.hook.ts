import { useCallback } from 'react';

import { BigNumber } from 'bignumber.js';

import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { ROUTE3_CONTRACT } from 'lib/route3/constants';
import { Route3ContractInterface } from 'lib/route3/interfaces';
import { mapToRoute3ExecuteHops } from 'lib/route3/utils/map-to-route3-hops';
import { useAccount, useTezos } from 'lib/temple/front';
import { tokensToAtoms } from 'lib/temple/helpers';
import { TEZOS_METADATA } from 'lib/temple/metadata';

import { useRoute3SwapParamsSelector } from '../store/route3/selectors';

const APP_ID = 2;

export const useRoute3 = () => {
  const tezos = useTezos();
  const { publicKeyHash } = useAccount();
  const { data: swapParams } = useRoute3SwapParamsSelector();

  const getRoute3SwapOpParams = useCallback(
    async (fromRoute3Token: Route3Token, toRoute3Token: Route3Token, inputAmount: BigNumber, slippageRatio: number) => {
      const param = {
        app_id: APP_ID,
        min_out: tokensToAtoms(new BigNumber(swapParams.output ?? 0), toRoute3Token.decimals)
          .multipliedBy(slippageRatio)
          .integerValue(),
        receiver: publicKeyHash,
        token_in_id: fromRoute3Token.id,
        token_out_id: toRoute3Token.id,
        hops: mapToRoute3ExecuteHops(swapParams.chains, fromRoute3Token.decimals)
      };

      const route3ContractInstance = await tezos.contract.at<Route3ContractInterface>(ROUTE3_CONTRACT);

      const swapOpParams = route3ContractInstance.methods.execute(
        param.token_in_id,
        param.token_out_id,
        param.min_out,
        param.receiver,
        param.hops,
        param.app_id
      );

      if (fromRoute3Token.symbol === 'XTZ') {
        return swapOpParams.toTransferParams({
          amount: tokensToAtoms(inputAmount, TEZOS_METADATA.decimals).toNumber(),
          mutez: true
        });
      }

      return swapOpParams.toTransferParams();
    },
    [tezos, publicKeyHash, swapParams.chains, swapParams.output]
  );

  return {
    getRoute3SwapOpParams
  };
};
