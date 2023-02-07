import { useCallback } from 'react';

import { BigNumber } from 'bignumber.js';

import { getRoute3SwapParams } from 'lib/apis/route3/get-route3-swap-params';
import { Route3Token } from 'lib/apis/route3/get-route3-tokens';
import { ROUTE3_CONTRACT } from 'lib/route3/constants';
import { Route3ContractInterface } from 'lib/route3/interfaces';
import { mapToRoute3ExecuteHops } from 'lib/route3/utils/map-to-execute-params';
import { useAccount, useTezos } from 'lib/temple/front';
import { tokensToAtoms } from 'lib/temple/helpers';
import { TEZOS_METADATA } from 'lib/temple/metadata';

const APP_ID = 2;

export const useRoute3 = () => {
  const tezos = useTezos();
  const { publicKeyHash } = useAccount();

  const getRoute3SwapOpParams = useCallback(
    async (
      fromRoute3Token: Route3Token,
      toRoute3Token: Route3Token,
      inputAmount: BigNumber,
      slippageTolerance: number | undefined
    ) => {
      const tradeOpParams = await getRoute3SwapParams({
        fromSymbol: fromRoute3Token.symbol,
        toSymbol: toRoute3Token.symbol,
        amount: inputAmount.toFixed()
      });

      const slippageRatio = (100 - (slippageTolerance ?? 0)) / 100;

      const param = {
        app_id: APP_ID,
        min_out: tokensToAtoms(new BigNumber(tradeOpParams.output * slippageRatio), toRoute3Token.decimals),
        receiver: publicKeyHash,
        token_in_id: fromRoute3Token.id,
        token_out_id: toRoute3Token.id,
        hops: mapToRoute3ExecuteHops(tradeOpParams.chains, fromRoute3Token.decimals)
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
    []
  );

  return {
    getRoute3SwapOpParams
  };
};
