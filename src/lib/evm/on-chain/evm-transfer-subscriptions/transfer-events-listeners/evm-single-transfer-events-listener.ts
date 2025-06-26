import { Log } from 'viem';

import { erc1155TransferBatchEvent } from 'lib/abi/erc1155';
import { toTokenSlug } from 'lib/assets';

import { EvmTransferEventsListener, TransferEvent } from './evm-transfer-events-listener';

type SingleTransferEvent = Exclude<TransferEvent, typeof erc1155TransferBatchEvent>;

type TransferSingleLog<T extends SingleTransferEvent> = Log<bigint, number, false, T>;

export abstract class EvmSingleTransferEventsListener<
  T extends SingleTransferEvent
> extends EvmTransferEventsListener<T> {
  protected abstract getTokenId(log: TransferSingleLog<T>): bigint | undefined;
  protected abstract getAmount(log: TransferSingleLog<T>): bigint | undefined;

  protected getAssetsSlugs(log: TransferSingleLog<T>) {
    const { address, args } = log;
    const { from, to } = args as Exclude<Log<bigint, number, false, T>['args'], readonly unknown[]>;
    const tokenId = this.getTokenId(log);
    const amount = this.getAmount(log);

    return (from === this.account || to === this.account) && amount && tokenId !== undefined
      ? [toTokenSlug(address, tokenId.toString())]
      : [];
  }
}
