import { isDefined } from '@rnw-community/shared';
import { Log } from 'viem';

import { erc1155TransferBatchEvent, erc1155TransferSingleEvent } from 'lib/abi/erc1155';
import { toTokenSlug } from 'lib/assets';

import { ListenersDelegate } from '../listeners-delegate';

import { EvmSingleTransferEventsListener } from './evm-single-transfer-events-listener';
import { EvmTransferEventsListener } from './evm-transfer-events-listener';
import { makeGetTransferEventsListener } from './make-get-transfer-events-listener';

class ERC1155SingleTransferEventsListener extends EvmSingleTransferEventsListener<typeof erc1155TransferSingleEvent> {
  protected getTokenId(log: Log<bigint, number, false, typeof erc1155TransferSingleEvent>) {
    return log.args.id;
  }

  protected getAmount(log: Log<bigint, number, false, typeof erc1155TransferSingleEvent>) {
    return log.args.value;
  }
}

class ERC1155BatchTransferEventsListener extends EvmTransferEventsListener<typeof erc1155TransferBatchEvent> {
  protected getAssetsSlugs(log: Log<bigint, number, false, typeof erc1155TransferBatchEvent>) {
    const { address, args } = log;
    const { ids, values, from, to } = args;

    if ((from !== this.account && to !== this.account) || !ids || !values) {
      return [];
    }

    return ids
      .map((rawTokenId, i) => {
        return values[i] ? toTokenSlug(address, rawTokenId.toString()) : undefined;
      })
      .filter(isDefined);
  }
}

class ERC1155TransferEventsListener extends ListenersDelegate<[string]> {
  constructor(httpRpcUrl: string, account: HexString) {
    super([
      new ERC1155SingleTransferEventsListener(httpRpcUrl, account, erc1155TransferSingleEvent),
      new ERC1155BatchTransferEventsListener(httpRpcUrl, account, erc1155TransferBatchEvent)
    ]);
  }
}

export const getERC1155TransferEventsListener = makeGetTransferEventsListener(ERC1155TransferEventsListener);
