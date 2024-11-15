import memoizee from 'memoizee';
import { nanoid } from 'nanoid';
import {
  HttpTransport,
  Log,
  PublicClient,
  WatchEventOnLogsParameter,
  WebSocketTransport,
  createPublicClient,
  webSocket
} from 'viem';

import { erc1155TransferBatchEvent, erc1155TransferSingleEvent } from 'lib/abi/erc1155';
import { toTokenSlug } from 'lib/assets';
import { delay } from 'lib/utils';
import { QueueOfUnique } from 'lib/utils/queue-of-unique';
import { getReadOnlyEvm } from 'temple/evm';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

interface EvmTransfersListenerConfig {
  account: HexString;
  mainHttpRpcUrl: string;
  otherRpcUrls: string[];
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

interface CallbackDescriptorBase {
  type: 'block' | 'tokenTransfer';
}

interface BlockCallbackDescriptor extends CallbackDescriptorBase {
  type: 'block';
}

interface TokenTransferCallbackDescriptor extends CallbackDescriptorBase {
  type: 'tokenTransfer';
  tokenSlug: string;
}

type CallbackDescriptor = BlockCallbackDescriptor | TokenTransferCallbackDescriptor;

// These intervals are added to prevent 429 errors
const QUEUE_ELEMENT_INTERVAL = 100;
const WATCH_REQUEST_INTERVAL = 80;

const BAN_LISTENING_ERRORS_CODES = [
  -32701, // Missing parameters
  -32600, // Invalid request
  -32601, // Method not found
  -32603, // Internal error
  -32001, // Resource not found
  -32004, // Method not supported
  32701, // Some websocket RPC nodes return positive error codes instead of negative counterparts
  32600,
  32601,
  32603,
  32001,
  32004
];

const getWssRpcClient = memoizee(
  (rpcUrl: string) =>
    createPublicClient({
      transport: webSocket(rpcUrl, { retryCount: 0 })
    }),
  { max: EVM_DEFAULT_NETWORKS.length * 4 }
);

/**
 * This class listens to token transfers and new blocks using multiple RPC URLs for one chain. RPCs are used in a
 * round-robin fashion.
 */
export class EvmTransfersListener {
  private readonly mainHttpRpcUrl: string;
  private readonly otherRpcUrls: string[];
  private mainRpcClient: PublicClient<HttpTransport>;
  private allRpcClients: PublicClient<HttpTransport | WebSocketTransport>[];
  private banRpcListeningEndTimestamps: number[];
  private currentRpcClientIndex = 0;
  private account: HexString;
  private onTokenTransfer: EvmTransfersListenerConfig['onTokenTransfer'];
  private onNewBlock: EvmTransfersListenerConfig['onNewBlock'];
  private cancelBlockSubscription: EmptyFn | null = null;
  private cancelEventsSubscriptions: EmptyFn[] | null = null;
  private callbacksQueue: QueueOfUnique<CallbackDescriptor> = new QueueOfUnique();
  private queueInterval: NodeJS.Timer;
  private readonly id: string;
  private isFinalized = false;

  constructor({ account, mainHttpRpcUrl, otherRpcUrls, onNewBlock, onTokenTransfer }: EvmTransfersListenerConfig) {
    this.otherRpcUrls = otherRpcUrls;
    this.mainHttpRpcUrl = mainHttpRpcUrl;
    this.mainRpcClient = getReadOnlyEvm(mainHttpRpcUrl);
    this.allRpcClients = otherRpcUrls
      .concat(mainHttpRpcUrl)
      .map<PublicClient<HttpTransport | WebSocketTransport>>(url =>
        url.startsWith('ws') ? getWssRpcClient(url) : getReadOnlyEvm(url)
      );
    this.banRpcListeningEndTimestamps = new Array(this.allRpcClients.length).fill(0);
    this.account = account;
    this.onNewBlock = onNewBlock;
    this.onTokenTransfer = onTokenTransfer;
    this.id = nanoid();
    this.handleNewBlockNumber = this.handleNewBlockNumber.bind(this);
    this.onError = this.onError.bind(this);
    this.handleLogs = this.handleLogs.bind(this);
    this.handleFirstQueueElement = this.handleFirstQueueElement.bind(this);
    this.subscribe();
    this.queueInterval = setInterval(() => this.handleFirstQueueElement(), QUEUE_ELEMENT_INTERVAL);
  }

  private async handleFirstQueueElement() {
    const descriptor = await this.callbacksQueue.pop();
    if (!descriptor) {
      return;
    }

    switch (descriptor.type) {
      case 'block':
        this.onNewBlock();
        break;
      case 'tokenTransfer':
        this.onTokenTransfer(descriptor.tokenSlug);
        break;
    }
  }

  get currentRpcClient() {
    return this.allRpcClients[this.currentRpcClientIndex];
  }

  finalize() {
    this.cancelAllSubscriptions();
    clearInterval(this.queueInterval);
    this.isFinalized = true;
  }

  private async subscribe() {
    const rpcClientIndex = this.currentRpcClientIndex;
    const rpcClient = this.allRpcClients[rpcClientIndex];

    this.cancelBlockSubscription = rpcClient.watchBlockNumber({
      onBlockNumber: this.handleNewBlockNumber,
      onError: error => this.onError(error, rpcClientIndex)
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
          this.currentRpcClient.watchEvent({
            onLogs: this.handleLogs,
            event,
            args,
            onError: error => this.onError(error, rpcClientIndex)
          })
        );
        await delay(WATCH_REQUEST_INTERVAL);
      }
    }
  }

  private handleNewBlockNumber() {
    return this.callbacksQueue.push({ type: 'block' });
  }

  private async handleTokenTransferEvent(address: HexString, tokenId: bigint, blockNumber: bigint | null) {
    const addTokenTransferToQueue = () =>
      this.callbacksQueue.push({ type: 'tokenTransfer', tokenSlug: toTokenSlug(address, tokenId.toString()) });

    if (blockNumber === null) {
      return addTokenTransferToQueue();
    }

    const httpRpcBlockNumber = await this.mainRpcClient.getBlockNumber();

    if (httpRpcBlockNumber >= blockNumber) {
      return addTokenTransferToQueue();
    }

    const unsubscribe = this.mainRpcClient.watchBlockNumber({
      onBlockNumber: newBlockNumber => {
        if (newBlockNumber >= blockNumber) {
          unsubscribe();
          return addTokenTransferToQueue();
        }

        return;
      },
      onError: error => {
        unsubscribe();
        return addTokenTransferToQueue();
      }
    });

    return;
  }

  private makeTokenTransferLogHandler<T extends ERC20TransferLog | ERC721TransferLog | ERC1155TransferSingleLog>(
    getTokenId: SyncFn<T, bigint | undefined>,
    getAmount: SyncFn<T, bigint | undefined>
  ) {
    return (log: T) => {
      const { address, blockNumber, args } = log;
      const { from, to } = args;
      const amount = getAmount(log);
      const tokenId = getTokenId(log);

      // Websocket RPCs enable us not to poll HTTP RPCs but they neglect event args
      if (from !== this.account && to !== this.account) {
        return;
      }

      if (amount && tokenId !== undefined) {
        this.handleTokenTransferEvent(address, tokenId, blockNumber);
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
    const { address, args, blockNumber } = log;
    const { ids, values, from, to } = args;

    if (from !== this.account && to !== this.account) {
      return;
    }

    ids?.forEach((rawTokenId, i) => {
      if (values?.[i]) {
        this.handleTokenTransferEvent(address, rawTokenId, blockNumber);
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
          break;
      }
    });
  }

  private cancelAllSubscriptions() {
    this.cancelBlockSubscription?.();
    this.cancelEventsSubscriptions?.forEach(cancel => cancel());
    this.cancelBlockSubscription = null;
    this.cancelEventsSubscriptions = null;
  }

  private async onError(error: Error, clientIndex: number) {
    if (clientIndex !== this.currentRpcClientIndex || this.isFinalized) {
      return;
    }

    console.error(
      error,
      this.id,
      this.account,
      this.mainHttpRpcUrl,
      clientIndex,
      this.otherRpcUrls[clientIndex] ?? this.mainHttpRpcUrl,
      this.banRpcListeningEndTimestamps
    );
    if ('code' in error && BAN_LISTENING_ERRORS_CODES.includes(error.code as number)) {
      this.banRpcListeningEndTimestamps[clientIndex] = Date.now() + 60 * 60_000;
    }

    this.cancelAllSubscriptions();
    const now = Date.now();
    const minBanEndTimestamp = Math.min(...this.banRpcListeningEndTimestamps);
    if (minBanEndTimestamp > now) {
      this.banRpcListeningEndTimestamps = this.banRpcListeningEndTimestamps.map(ts => ts - minBanEndTimestamp + now);
    }
    const rightNextRpcClientIndex = this.banRpcListeningEndTimestamps.slice(clientIndex + 1).findIndex(ts => ts <= now);
    const leftNextRpcClientIndex = this.banRpcListeningEndTimestamps.slice(0, clientIndex).findIndex(ts => ts <= now);
    if (rightNextRpcClientIndex === -1 && leftNextRpcClientIndex === -1) {
      this.currentRpcClientIndex = (clientIndex + 1) % this.allRpcClients.length;
    } else if (rightNextRpcClientIndex === -1) {
      this.currentRpcClientIndex = leftNextRpcClientIndex + 1;
    } else {
      this.currentRpcClientIndex = rightNextRpcClientIndex + clientIndex + 1;
    }
    await this.subscribe();
  }
}
