import { useCallback, useState, useEffect } from 'react';

import { TransferParams } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

import { Route3Chain } from 'lib/apis/route3/fetch-route3-swap-params';
import { Route3Token } from 'lib/apis/route3/fetch-route3-tokens';
import { ROUTE3_CONTRACT } from 'lib/route3/constants';
import { Route3ContractInterface } from 'lib/route3/interfaces';
import { mapToRoute3ExecuteHops } from 'lib/route3/utils/map-to-route3-hops';
import { useAccount, useTezos } from 'lib/temple/front';
import { tokensToAtoms } from 'lib/temple/helpers';
import { TEZOS_METADATA } from 'lib/temple/metadata';
import { getTransferPermissions } from 'lib/utils/get-transfer-permissions';

const APP_ID = 2;

export const useRoute3 = () => {
  const tezos = useTezos();
  const { publicKeyHash } = useAccount();

  const [swapContract, setSwapContract] = useState<Route3ContractInterface>();

  useEffect(() => void tezos.contract.at<Route3ContractInterface>(ROUTE3_CONTRACT).then(setSwapContract), [tezos]);

  return useCallback(
    async (
      fromRoute3Token: Route3Token,
      toRoute3Token: Route3Token,
      inputAmount: BigNumber,
      minimumReceived: BigNumber,
      chains: Array<Route3Chain>
    ) => {
      if (swapContract === undefined) {
        return;
      }

      const resultParams: Array<TransferParams> = [];

      const swapOpParams = swapContract.methods.execute(
        fromRoute3Token.id,
        toRoute3Token.id,
        minimumReceived,
        publicKeyHash,
        mapToRoute3ExecuteHops(chains, fromRoute3Token.decimals),
        APP_ID
      );

      if (fromRoute3Token.symbol.toLowerCase() === 'xtz') {
        resultParams.push(
          swapOpParams.toTransferParams({
            amount: tokensToAtoms(inputAmount, TEZOS_METADATA.decimals).toNumber(),
            mutez: true
          })
        );
      } else {
        resultParams.push(swapOpParams.toTransferParams());
      }

      const { approve, revoke } = await getTransferPermissions(
        tezos,
        ROUTE3_CONTRACT,
        publicKeyHash,
        fromRoute3Token,
        inputAmount
      );

      resultParams.unshift(...approve);
      resultParams.push(...revoke);

      return resultParams;
    },
    [tezos, publicKeyHash, swapContract]
  );
};
