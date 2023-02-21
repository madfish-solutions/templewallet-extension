import { useCallback } from 'react';

import { BigNumber } from 'bignumber.js';

import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { ROUTE3_CONTRACT } from 'lib/route3/constants';
import { Route3ContractInterface } from 'lib/route3/interfaces';
import { mapToRoute3ExecuteHops } from 'lib/route3/utils/map-to-route3-hops';
import { useAccount, useTezos } from 'lib/temple/front';
import { tokensToAtoms } from 'lib/temple/helpers';
import { TEZOS_METADATA } from 'lib/temple/metadata';
import { getTransferPermissions } from 'lib/utils/get-transfer-permissions';

import { useSwapParamsSelector } from '../store/swap/selectors';

const APP_ID = 2;

export const useRoute3 = () => {
  const tezos = useTezos();
  const { publicKeyHash } = useAccount();
  const { data: swapParams } = useSwapParamsSelector();

  return useCallback(
    async (fromRoute3Token: Route3Token, toRoute3Token: Route3Token, minimumReceived: BigNumber) => {
      const route3ContractInstance = await tezos.contract.at<Route3ContractInterface>(ROUTE3_CONTRACT);

      const swapOpParams = route3ContractInstance.methods.execute(
        fromRoute3Token.id,
        toRoute3Token.id,
        minimumReceived,
        publicKeyHash,
        mapToRoute3ExecuteHops(swapParams.chains, fromRoute3Token.decimals),
        APP_ID
      );

      const { approve, revoke } = await getTransferPermissions(
        tezos,
        ROUTE3_CONTRACT,
        publicKeyHash,
        fromRoute3Token,
        new BigNumber(swapParams.input ?? 0)
      );

      if (fromRoute3Token.symbol === 'XTZ') {
        return [
          ...approve,
          swapOpParams.toTransferParams({
            amount: tokensToAtoms(new BigNumber(swapParams.input ?? 0), TEZOS_METADATA.decimals).toNumber(),
            mutez: true
          }),
          ...revoke
        ];
      }

      return [...approve, swapOpParams.toTransferParams(), ...revoke];
    },
    [tezos, publicKeyHash, swapParams.chains, swapParams.output]
  );
};
