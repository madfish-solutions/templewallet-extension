import { Log } from 'viem';

import { erc20TransferEvent } from 'lib/abi/erc20';
import { EvmNetworkEssentials } from 'temple/networks';

import { EvmSingleTransferEventsListener } from './evm-single-transfer-events-listener';
import { makeGetTransferEventsListener } from './make-get-transfer-events-listener';

class ERC20SingleTransferEventsListener extends EvmSingleTransferEventsListener<typeof erc20TransferEvent> {
  constructor(network: EvmNetworkEssentials, account: HexString) {
    super(network, account, erc20TransferEvent);
  }

  protected getTokenId() {
    return 0n;
  }

  protected getAmount(log: Log<bigint, number, false, typeof erc20TransferEvent>) {
    return log.args.value;
  }
}

export const getERC20TransferEventsListener = makeGetTransferEventsListener(ERC20SingleTransferEventsListener);
