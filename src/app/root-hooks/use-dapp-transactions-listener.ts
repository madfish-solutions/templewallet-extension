import { useEffect } from 'react';

import { dispatch } from 'app/store';
import { addPendingEvmOtherTransactionAction } from 'app/store/evm/pending-transactions/actions';
import { addPendingTezosTransactionAction } from 'app/store/tezos/pending-transactions/actions';
import { TempleMessageType, TempleNotification } from 'lib/temple/types';
import { intercomClient } from 'temple/front/intercom-client';
import { makeBlockExplorerHref, useGetActiveBlockExplorer } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

export const useDAppTransactionsListener = () => {
  const getTezosActiveBlockExplorer = useGetActiveBlockExplorer(TempleChainKind.Tezos);
  const getEvmActiveBlockExplorer = useGetActiveBlockExplorer(TempleChainKind.EVM);

  useEffect(() => {
    return intercomClient.subscribe((msg: TempleNotification) => {
      if (msg?.type !== TempleMessageType.TempleDAppTransactionSent) return;

      if (msg.chainType === TempleChainKind.EVM) {
        const { txHash, accountPkh, network } = msg;
        const blockExplorer = getEvmActiveBlockExplorer(network.chainId.toString());
        dispatch(
          addPendingEvmOtherTransactionAction({
            txHash,
            accountPkh,
            network,
            blockExplorerUrl: makeBlockExplorerHref(blockExplorer.url, txHash, 'tx', TempleChainKind.EVM),
            submittedAt: Date.now()
          })
        );
      } else {
        const { txHash, accountPkh, network } = msg;
        const blockExplorer = getTezosActiveBlockExplorer(network.chainId);
        dispatch(
          addPendingTezosTransactionAction({
            txHash,
            accountPkh,
            network,
            blockExplorerUrl: makeBlockExplorerHref(blockExplorer.url, txHash, 'tx', TempleChainKind.Tezos),
            submittedAt: Date.now()
          })
        );
      }
    });
  }, [getEvmActiveBlockExplorer, getTezosActiveBlockExplorer]);
};
