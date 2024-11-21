import { HttpTransport, Log, PublicClient, WatchEventOnLogsParameter } from 'viem';

import { erc1155TransferBatchEvent, erc1155TransferSingleEvent } from 'lib/abi/erc1155';
import { toTokenSlug } from 'lib/assets';
import { EVM_RPC_REQUESTS_INTERVAL } from 'lib/fixed-times';
import { delay } from 'lib/utils';
import { getReadOnlyEvm } from 'temple/evm';

interface EvmTransfersListenerConfig {
  account: HexString;
  mainHttpRpcUrl: string;
  onTokenTransfer: SyncFn<string>;
  onNewBlock: EmptyFn;
}

type ERC20TransferLog = Log<bigint, number, false, typeof erc20TransferEvent>;
type ERC721TransferLog = Log<bigint, number, false, typeof erc721TransferEvent>;
type ERC1155TransferSingleLog = Log<bigint, number, false, typeof erc1155TransferSingleEvent>;
type ERC1155TransferBatchLog = Log<bigint, number, false, typeof erc1155TransferBatchEvent>;

const isErc721TransferLog = (log: ERC20TransferLog | ERC721TransferLog): log is ERC721TransferLog =>
  log.topics.length === 4;

const erc20TransferEvent = {
  anonymous: false,
  type: 'event',
  name: 'Transfer',
  inputs: [
    {
      indexed: true,
      name: 'from',
      type: 'address'
    },
    {
      indexed: true,
      name: 'to',
      type: 'address'
    },
    {
      indexed: false,
      name: 'value',
      type: 'uint256'
    }
  ]
} as const;

const erc721TransferEvent = {
  anonymous: false,
  type: 'event',
  name: 'Transfer',
  inputs: [
    {
      indexed: true,
      name: 'from',
      type: 'address'
    },
    {
      indexed: true,
      name: 'to',
      type: 'address'
    },
    {
      indexed: true,
      name: 'tokenId',
      type: 'uint256'
    }
  ]
} as const;

/**
 * This class listens to token transfers and new blocks using an HTTP RPC.
 */
export class EvmTransfersListener {
  private rpcClient: PublicClient<HttpTransport>;
  private account: HexString;
  private onTokenTransfer: EvmTransfersListenerConfig['onTokenTransfer'];
  private onNewBlock: EvmTransfersListenerConfig['onNewBlock'];
  private cancelBlockSubscription: EmptyFn | null = null;
  private cancelEventsSubscriptions: EmptyFn[] | null = null;
  private isFinalized = false;

  constructor({ account, mainHttpRpcUrl, onNewBlock, onTokenTransfer }: EvmTransfersListenerConfig) {
    this.rpcClient = getReadOnlyEvm(mainHttpRpcUrl);
    this.account = account;
    this.onNewBlock = onNewBlock;
    this.onTokenTransfer = onTokenTransfer;
    this.onError = this.onError.bind(this);
    this.handleLogs = this.handleLogs.bind(this);
    this.subscribe();
  }

  finalize() {
    this.cancelAllSubscriptions();
    this.isFinalized = true;
  }

  private async subscribe() {
    this.cancelBlockSubscription = this.rpcClient.watchBlockNumber({
      onBlockNumber: () => this.onNewBlock,
      onError: this.onError
    });

    this.cancelEventsSubscriptions = [];
    const tokensEvents = [
      erc1155TransferBatchEvent,
      erc1155TransferSingleEvent,
      erc20TransferEvent,
      erc721TransferEvent
    ];
    const eventsArgs = [{ from: this.account }, { to: this.account }];
    for (const event of tokensEvents) {
      for (const args of eventsArgs) {
        // Failure of previous subscription has been detected
        if (this.cancelEventsSubscriptions === null) {
          return;
        }

        this.cancelEventsSubscriptions.push(
          this.rpcClient.watchEvent({
            onLogs: this.handleLogs,
            event,
            args,
            onError: this.onError
          })
        );
        await delay(EVM_RPC_REQUESTS_INTERVAL);
      }
    }
  }

  private makeTokenTransferLogHandler<T extends ERC20TransferLog | ERC721TransferLog | ERC1155TransferSingleLog>(
    getTokenId: SyncFn<T, bigint | undefined>,
    getAmount: SyncFn<T, bigint | undefined>
  ) {
    return (log: T) => {
      const { address, args } = log;
      const { from, to } = args;
      const amount = getAmount(log);
      const tokenId = getTokenId(log);

      // Websocket RPCs enable us not to poll HTTP RPCs but they neglect event args
      if (from !== this.account && to !== this.account) {
        return;
      }

      if (amount && tokenId !== undefined) {
        this.onTokenTransfer(toTokenSlug(address, tokenId.toString()));
      }
    };
  }

  private handleERC20Log = this.makeTokenTransferLogHandler<ERC20TransferLog>(
    () => BigInt(0),
    log => log.args.value
  );

  private handleERC721Log = this.makeTokenTransferLogHandler<ERC721TransferLog>(
    log => log.args.tokenId,
    () => BigInt(1)
  );

  private handleERC1155TransferSingleLog = this.makeTokenTransferLogHandler<ERC1155TransferSingleLog>(
    log => log.args.id,
    log => log.args.value
  );

  private handleERC1155TransferBatchLog(log: ERC1155TransferBatchLog) {
    const { address, args } = log;
    const { ids, values, from, to } = args;

    if (from !== this.account && to !== this.account) {
      return;
    }

    ids?.forEach((rawTokenId, i) => {
      if (values?.[i]) {
        this.onTokenTransfer(toTokenSlug(address, rawTokenId.toString()));
      }
    });
  }

  private handleLogs(
    logs: WatchEventOnLogsParameter<
      | typeof erc1155TransferBatchEvent
      | typeof erc1155TransferSingleEvent
      | typeof erc721TransferEvent
      | typeof erc20TransferEvent
    >
  ) {
    logs.forEach(log => {
      switch (log.eventName) {
        case 'TransferBatch':
          this.handleERC1155TransferBatchLog(log as ERC1155TransferBatchLog);
          break;
        case 'TransferSingle':
          this.handleERC1155TransferSingleLog(log as ERC1155TransferSingleLog);
          break;
        default:
          const typecastLog = log as ERC20TransferLog | ERC721TransferLog;
          if (isErc721TransferLog(typecastLog)) {
            this.handleERC721Log(typecastLog);
          } else {
            this.handleERC20Log(typecastLog);
          }
      }
    });
  }

  private cancelAllSubscriptions() {
    this.cancelBlockSubscription?.();
    this.cancelEventsSubscriptions?.forEach(cancel => cancel());
    this.cancelBlockSubscription = null;
    this.cancelEventsSubscriptions = null;
  }

  private async onError(error: Error) {
    if (this.isFinalized) {
      return;
    }

    console.error(error);
    this.cancelAllSubscriptions();
    await delay(1000);
    await this.subscribe();
  }
}
