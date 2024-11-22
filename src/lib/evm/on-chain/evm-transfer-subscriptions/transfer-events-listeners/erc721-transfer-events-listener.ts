import { Log } from 'viem';

import { erc721TransferEvent } from 'lib/abi/erc721';

import { EvmSingleTransferEventsListener } from './evm-single-transfer-events-listener';
import { makeGetTransferEventsListener } from './make-get-transfer-events-listener';

class ERC721SingleTransferEventsListener extends EvmSingleTransferEventsListener<typeof erc721TransferEvent> {
  constructor(chainId: number, httpRpcUrl: string, account: HexString) {
    super(chainId, httpRpcUrl, account, erc721TransferEvent);
  }

  protected getTokenId(log: Log<bigint, number, false, typeof erc721TransferEvent>) {
    return log.args.tokenId;
  }

  protected getAmount() {
    return BigInt(1);
  }
}

export const getERC721TransferEventsListener = makeGetTransferEventsListener(ERC721SingleTransferEventsListener);
