import { isDefined } from '@rnw-community/shared';

import {
  ActivityOperKindEnum,
  ActivityOperTransferType,
  ActivityStatus,
  EvmActivity,
  EvmActivityAsset,
  EvmOperation,
  TezosActivity
} from 'lib/activity';
import { getEvmActivities } from 'lib/activity/evm/fetch';
import { parseApprovalLog } from 'lib/activity/evm/parse';
import { parseTezosOperationsGroup } from 'lib/activity/tezos';
import { fetchOperGroupsForOperations, fetchOperations } from 'lib/activity/tezos/fetch';
import { TezosActivityOlderThan } from 'lib/activity/tezos/types';
import {
  EtherlinkChainId,
  fetchGetAccountOperations,
  fetchAllInternalTransactions,
  isErc20TokenTransfer,
  isErc721TokenTransfer,
  fetchAllTxLogs,
  EtherlinkTransaction,
  EtherlinkOperationsPageParams,
  EtherlinkTokenTransfer,
  fetchGetTokensTransfers,
  EtherlinkTokenTransfersPageParams,
  fetchGetCoinBalanceHistory,
  fetchAllInternalTokensTransfers,
  EtherlinkInternalTx
} from 'lib/apis/etherlink';
import { fromAssetSlug } from 'lib/assets';
import { toEvmAssetSlug } from 'lib/assets/utils';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { EvmOperationKind, getOperationKind } from 'lib/evm/on-chain/transactions';
import { equalsIgnoreCase } from 'lib/evm/on-chain/utils/common.utils';
import { EvmAssetStandard } from 'lib/evm/types';
import { getEvmNativeAssetIcon } from 'lib/images-uri';
import { EvmCollectibleMetadata, EvmTokenMetadata } from 'lib/metadata/types';
import {
  GetEvmActivitiesIntervalResult,
  GetTezosActivitiesIntervalResult,
  compareTezosIntervalLimits,
  getClosestEvmActivitiesInterval,
  getClosestTezosActivitiesInterval,
  tezosLowestIntervalLimit,
  putEvmActivities,
  putTezosActivities,
  getSeparateTezosActivities
} from 'lib/temple/activity/repo';
import { DEFAULT_EVM_CHAINS_SPECS } from 'lib/temple/chains-specs';
import { TempleTezosChainId } from 'lib/temple/types';
import { filterUnique } from 'lib/utils';
import { TempleChainKind } from 'temple/types';

export interface AllEtherlinkActivitiesPageParams {
  operationsPageParams: EtherlinkOperationsPageParams | nullish;
  tokensTransfersPageParams: EtherlinkTokenTransfersPageParams | nullish;
}

interface GetClosestNonEmptyActivitiesIntervalConfig<P, I, A> {
  getClosestActivitiesInterval: (olderThan: P | undefined) => Promise<I | undefined>;
  isGenesisBlockPointer: SyncFn<P, boolean>;
  getActivities: SyncFn<I, A[]>;
  getNewOlderThan: SyncFn<I, P>;
  canUseCachedInterval: (interval: I, olderThan: P) => boolean;
  signal: AbortSignal;
  olderThan?: P;
}

interface FetchActivitiesWithCacheConfig<P, I, A, M = never, R = A[]>
  extends GetClosestNonEmptyActivitiesIntervalConfig<P, I, A> {
  /** May we fetch assets metadata here intentionally? */
  fetchActivities: (olderThan?: P) => Promise<R>;
  getNewContractMatchItems: SyncFn<R, A[]>;
  getAllNewItems?: SyncFn<R, A[]>;
  getAssetsMetadata?: SyncFn<R, StringRecord<M>>;
  getReachedTheEnd?: SyncFn<R, boolean>;
  putNewActivities: (contractMatchActivities: A[], allActivities: A[], olderThan?: P) => Promise<void>;
}

const getClosestNonEmptyActivitiesInterval = async <P, I, A>({
  olderThan,
  getClosestActivitiesInterval,
  signal,
  canUseCachedInterval,
  getActivities,
  getNewOlderThan,
  isGenesisBlockPointer
}: GetClosestNonEmptyActivitiesIntervalConfig<P, I, A>) => {
  let currentOlderThan = olderThan;
  let newActivities: A[] | undefined;
  do {
    try {
      const activitiesInterval = await getClosestActivitiesInterval(currentOlderThan);

      signal.throwIfAborted();

      if (activitiesInterval && (!currentOlderThan || canUseCachedInterval(activitiesInterval, currentOlderThan))) {
        newActivities = getActivities(activitiesInterval);
        currentOlderThan = getNewOlderThan(activitiesInterval);
      } else {
        newActivities = undefined;
      }
    } catch (e) {
      console.error(e);
      newActivities = undefined;
    }
  } while (newActivities?.length === 0 && (!currentOlderThan || !isGenesisBlockPointer(currentOlderThan)));

  if (currentOlderThan && isGenesisBlockPointer(currentOlderThan)) {
    newActivities = [];
  }

  return { currentOlderThan, newActivities };
};
const fetchActivitiesWithCache = async <P, I, A, M = never, R = A[]>({
  getClosestActivitiesInterval,
  fetchActivities,
  getNewContractMatchItems,
  getAllNewItems = getNewContractMatchItems,
  getAssetsMetadata,
  getReachedTheEnd,
  isGenesisBlockPointer,
  getActivities,
  getNewOlderThan,
  canUseCachedInterval,
  putNewActivities,
  signal,
  olderThan
}: FetchActivitiesWithCacheConfig<P, I, A, M, R>) => {
  let currentOlderThan = olderThan;
  let assetsMetadata: StringRecord<M> = {};

  let activitiesFromCache: A[] | undefined;
  if (olderThan) {
    const getIntervalResults = await getClosestNonEmptyActivitiesInterval({
      olderThan,
      getClosestActivitiesInterval,
      signal,
      canUseCachedInterval,
      getActivities,
      getNewOlderThan,
      isGenesisBlockPointer
    });
    currentOlderThan = getIntervalResults.currentOlderThan;
    activitiesFromCache = getIntervalResults.newActivities;
  }

  let reachedTheEnd: boolean | undefined;
  let activities: A[];
  if (activitiesFromCache) {
    activities = activitiesFromCache;
  } else {
    try {
      const response = await fetchActivities(currentOlderThan);
      reachedTheEnd = getReachedTheEnd?.(response);
      activities = getNewContractMatchItems(response);
      if (getAssetsMetadata) {
        assetsMetadata = getAssetsMetadata(response);
      }
      signal.throwIfAborted();

      try {
        await putNewActivities(activities, getAllNewItems(response), currentOlderThan);
      } catch (e) {
        console.error(e);
      }
    } catch (e) {
      console.error(e);
      const getIntervalResults = await getClosestNonEmptyActivitiesInterval({
        olderThan,
        getClosestActivitiesInterval,
        signal,
        canUseCachedInterval: () => true,
        getActivities,
        getNewOlderThan,
        isGenesisBlockPointer
      });
      currentOlderThan = getIntervalResults.currentOlderThan;
      activities = getIntervalResults.newActivities ?? [];
    }
  }

  signal.throwIfAborted();

  return { activities, assetsMetadata, reachedTheEnd };
};

interface FetchEvmActivitiesWithCacheConfig {
  chainId: number;
  accountAddress: HexString;
  assetSlug?: string;
  signal: AbortSignal;
  olderThan?: `${number}`;
}

export const fetchEvmActivitiesWithCache = async ({
  chainId,
  accountAddress,
  assetSlug,
  signal,
  olderThan
}: FetchEvmActivitiesWithCacheConfig) => {
  const contractAddress = assetSlug ? fromAssetSlug(assetSlug)[0] : undefined;

  return fetchActivitiesWithCache<`${number}`, GetEvmActivitiesIntervalResult, EvmActivity>({
    getClosestActivitiesInterval: currentOlderThan =>
      getClosestEvmActivitiesInterval({
        olderThanBlockHeight: currentOlderThan,
        chainId,
        account: accountAddress,
        contractAddress,
        maxItems: 50
      }),
    fetchActivities: currentOlderThan => getEvmActivities(chainId, accountAddress, assetSlug, currentOlderThan, signal),
    getNewContractMatchItems: response => response,
    isGenesisBlockPointer: pointer => Number(pointer) === 0,
    getActivities: interval => interval.activities,
    getNewOlderThan: interval => `${interval.oldestBlockHeight}`,
    canUseCachedInterval: (interval, currentOlderThan) => interval.newestBlockHeight === Number(currentOlderThan) - 1,
    putNewActivities: (activities, _, currentOlderThan) =>
      putEvmActivities({
        activities,
        chainId,
        account: accountAddress,
        contractAddress,
        olderThanBlockHeight: currentOlderThan
      }),
    signal,
    olderThan
  });
};

interface FetchEtherlinkActivitiesWithCacheConfig extends Omit<FetchEvmActivitiesWithCacheConfig, 'olderThan'> {
  chainId: EtherlinkChainId;
  olderThan?: AllEtherlinkActivitiesPageParams;
}

const erc20ApprovalEventRegex = /Approval\(address indexed [A-z_]+, address indexed [A-z_]+, uint256 [A-z_]+\)/;
const erc721SingleApprovalEventRegex =
  /Approval\(address indexed [A-z_]+, address indexed [A-z_]+, uint256 indexed [A-z_]+\)/;

type NullToUndefined<T extends object> = {
  [K in keyof T]: Replace<T[K], null, undefined>;
};
const nullToUndefined = <T extends object>(obj: T): NullToUndefined<T> => {
  const result: Partial<NullToUndefined<T>> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // @ts-expect-error
      result[key] = obj[key] === null ? undefined : obj[key];
    }
  }
  return result as NullToUndefined<T>;
};

const ETHERLINK_ITEMS_PER_PAGE = 50;
const getBlockNumberFromOlderThan = (olderThan: AllEtherlinkActivitiesPageParams | undefined) => {
  const { operationsPageParams, tokensTransfersPageParams } = olderThan ?? {};
  const { block_number: blockNumber } = operationsPageParams ?? tokensTransfersPageParams ?? {};

  return blockNumber;
};
export const fetchEtherlinkActivitiesWithCache = async ({
  chainId,
  accountAddress,
  assetSlug,
  signal,
  olderThan
}: FetchEtherlinkActivitiesWithCacheConfig) => {
  const contractAddress = assetSlug ? fromAssetSlug(assetSlug)[0] : undefined;

  return fetchActivitiesWithCache<
    AllEtherlinkActivitiesPageParams,
    GetEvmActivitiesIntervalResult,
    EvmActivity,
    EvmTokenMetadata | EvmCollectibleMetadata,
    {
      allActivities: EvmActivity[];
      nextPageParams: AllEtherlinkActivitiesPageParams;
      assetsMetadata: StringRecord<EvmTokenMetadata | EvmCollectibleMetadata>;
    }
  >({
    getClosestActivitiesInterval: currentOlderThan => {
      const blockNumber = getBlockNumberFromOlderThan(currentOlderThan);

      return getClosestEvmActivitiesInterval({
        olderThanBlockHeight: isDefined(blockNumber) ? `${blockNumber}` : undefined,
        chainId,
        account: accountAddress,
        contractAddress,
        maxItems: ETHERLINK_ITEMS_PER_PAGE
      });
    },
    fetchActivities: async currentOlderThan => {
      console.log('oy vey 0', currentOlderThan);
      const { operationsPageParams, tokensTransfersPageParams } = currentOlderThan ?? {};
      let explicitOperations: EtherlinkTransaction[];
      let explicitOperationsNextPageParams: EtherlinkOperationsPageParams | nullish;
      const explicitOperationsPage =
        operationsPageParams === null
          ? { items: [], nextPageParams: null }
          : await fetchGetAccountOperations({
              chainId,
              address: accountAddress,
              pageParams: operationsPageParams,
              signal
            });
      explicitOperations = explicitOperationsPage.items;
      explicitOperationsNextPageParams = explicitOperationsPage.nextPageParams;
      let { items: coinBalanceHistoryItems } =
        operationsPageParams === null
          ? { items: [] }
          : await fetchGetCoinBalanceHistory({
              chainId,
              address: accountAddress,
              signal,
              pageParams: operationsPageParams && {
                block_number: operationsPageParams.block_number,
                items_count: operationsPageParams.items_count
              }
            });
      let tokensTransfers: EtherlinkTokenTransfer[];
      let tokensTransfersNextPageParams: EtherlinkTokenTransfersPageParams | nullish;
      const tokensTransfersPage =
        tokensTransfersPageParams === null
          ? { items: [], nextPageParams: null }
          : await fetchGetTokensTransfers({
              address: accountAddress,
              pageParams: tokensTransfersPageParams,
              signal,
              chainId
            });
      tokensTransfers = tokensTransfersPage.items;
      tokensTransfersNextPageParams = tokensTransfersPage.nextPageParams;
      console.log('oy vey 1', {
        explicitOperations,
        explicitOperationsNextPageParams,
        tokensTransfers,
        tokensTransfersNextPageParams,
        coinBalanceHistoryItems
      });
      if (
        explicitOperationsNextPageParams &&
        tokensTransfersNextPageParams &&
        explicitOperationsNextPageParams.block_number <= tokensTransfersNextPageParams.block_number
      ) {
        console.log('oy vey 2');
        const lastTransferHash = tokensTransfers.at(-1)!.block_hash;
        const lastTxTokensTransfers = await fetchAllInternalTokensTransfers({
          txHash: lastTransferHash,
          chainId,
          signal
        });
        console.log('oy vey 3', lastTxTokensTransfers);
        tokensTransfers = tokensTransfers
          .filter(({ transaction_hash }) => transaction_hash !== lastTransferHash)
          .concat(
            lastTxTokensTransfers
              .filter(({ from, to }) => [from, to].some(({ hash }) => equalsIgnoreCase(hash, accountAddress)))
              .sort(({ log_index: aLogIndex }, { log_index: bLogIndex }) => bLogIndex - aLogIndex) ?? []
          );
        const lastTokenTransfer = tokensTransfers.at(-1)!;
        tokensTransfersNextPageParams = {
          block_number: lastTokenTransfer.block_number,
          index: lastTokenTransfer.log_index
        };

        explicitOperations = explicitOperations.filter(
          ({ block_number: blockNumber }) => blockNumber >= tokensTransfersNextPageParams!.block_number
        );
        coinBalanceHistoryItems = coinBalanceHistoryItems.filter(
          ({ block_number: blockNumber }) => blockNumber >= tokensTransfersNextPageParams!.block_number
        );
        const lastExplicitOperation = explicitOperations.at(-1);
        if (lastExplicitOperation) {
          console.log('oy vey 3.1');
          const { block_number, fee, hash, position, timestamp, value } = lastExplicitOperation;
          explicitOperationsNextPageParams = {
            block_number,
            fee: fee?.value ?? '0',
            hash,
            index: position,
            inserted_at: timestamp,
            items_count: (operationsPageParams?.items_count ?? 0) + explicitOperations.length,
            value
          };
        } else {
          console.log('oy vey 3.2');
          explicitOperationsNextPageParams = operationsPageParams;
        }
        console.log('oy vey 4', {
          explicitOperations,
          explicitOperationsNextPageParams,
          tokensTransfers,
          tokensTransfersNextPageParams,
          coinBalanceHistoryItems
        });
      } else if (explicitOperationsNextPageParams && tokensTransfersNextPageParams) {
        console.log('oy vey 5');
        const { block_number: lastOperationBlockNumber } = explicitOperations.at(-1)!;
        const earliestBlockNumberOperationsHashes = new Set(
          explicitOperations
            .filter(({ block_number: blockNumber }) => blockNumber === lastOperationBlockNumber)
            .map(({ hash }) => hash.toLowerCase())
        );
        tokensTransfers = tokensTransfers.filter(
          ({ block_number: blockNumber, transaction_hash: txHash }) =>
            blockNumber > lastOperationBlockNumber || earliestBlockNumberOperationsHashes.has(txHash.toLowerCase())
        );
        const lastTokenTransfer = tokensTransfers.at(-1);
        tokensTransfersNextPageParams = lastTokenTransfer
          ? {
              block_number: lastTokenTransfer.block_number,
              index: lastTokenTransfer.log_index
            }
          : tokensTransfersPageParams;
        console.log('oy vey 6', {
          explicitOperations,
          explicitOperationsNextPageParams,
          tokensTransfers,
          tokensTransfersNextPageParams,
          coinBalanceHistoryItems
        });
      }

      const assetsMetadata: StringRecord<EvmTokenMetadata | EvmCollectibleMetadata> = {};
      const rawActivitiesByHash: StringRecord<{
        tx?: EtherlinkTransaction;
        tokensTransfers: EtherlinkTokenTransfer[];
        nativeCoinDelta: string;
      }> = {};
      explicitOperations.forEach((op, i) => {
        const fee = op.fee?.value ?? '0';
        const { delta: nativeCoinDeltaWithFee } = coinBalanceHistoryItems[i] ?? { delta: `-${fee}` };

        rawActivitiesByHash[op.hash] = {
          tx: op,
          tokensTransfers: [],
          nativeCoinDelta: (BigInt(nativeCoinDeltaWithFee) + BigInt(fee)).toString()
        };
      });
      tokensTransfers.forEach(transfer => {
        const { transaction_hash: txHash } = transfer;
        if (rawActivitiesByHash[txHash]) {
          rawActivitiesByHash[txHash].tokensTransfers.push(transfer);
        } else {
          rawActivitiesByHash[txHash] = {
            tokensTransfers: [transfer],
            nativeCoinDelta: '0'
          };
        }
        if (isErc20TokenTransfer(transfer)) {
          const { address_hash: address, decimals, symbol, name, icon_url: iconURL } = transfer.token;
          assetsMetadata[toEvmAssetSlug(address)] = nullToUndefined({
            standard: EvmAssetStandard.ERC20,
            symbol,
            address,
            name,
            decimals: decimals ? Number(decimals) : undefined,
            iconURL
          });
        } else {
          const {
            token,
            id: tokenId,
            metadata,
            image_url: fullImageUrl,
            external_app_url: externalUrl,
            animation_url: animationUrl
          } = transfer.total.token_instance;
          const {
            address_hash: address,
            symbol,
            name: tokenName,
            decimals: rawDecimals,
            icon_url: iconFallback
          } = token;
          const { attributes, description, name: collectibleName, image: metadataImage } = metadata ?? {};
          const iconURL = metadataImage ?? iconFallback;

          assetsMetadata[toEvmAssetSlug(address, tokenId)] = nullToUndefined({
            symbol,
            address,
            name: tokenName,
            decimals: Number(rawDecimals ?? 0),
            iconURL,
            tokenId,
            image: fullImageUrl ?? metadataImage,
            collectibleName,
            description,
            attributes,
            externalUrl,
            animationUrl
          });
        }
      });
      console.log('oy vey 7', { assetsMetadata, rawActivitiesByHash });

      const activitiesByHash: StringRecord<EvmActivity> = {};
      const {
        address: gasAddress,
        decimals: gasDecimals,
        symbol: gasSymbol
      } = DEFAULT_EVM_CHAINS_SPECS[chainId].currency!;
      const gasAsset = {
        contract: gasAddress,
        decimals: gasDecimals,
        nft: false,
        symbol: gasSymbol,
        iconURL: getEvmNativeAssetIcon(chainId, undefined, 'llamao') ?? undefined
      };
      const parseTokenTransfer = (transfer: EtherlinkTokenTransfer): EvmOperation => {
        const { from, to, log_index: logIndex } = transfer;
        const isSending = equalsIgnoreCase(from.hash, accountAddress);
        const amountNotSigned = isErc721TokenTransfer(transfer) ? '1' : transfer.total.value;
        const assetIsToken = isErc20TokenTransfer(transfer);
        let asset: EvmActivityAsset;
        if (assetIsToken) {
          const { address_hash: address, decimals, symbol, name, icon_url: iconURL } = transfer.token;
          asset = nullToUndefined({
            contract: address,
            amountSigned: isSending ? `-${amountNotSigned}` : amountNotSigned,
            decimals: decimals ? Number(decimals) : undefined,
            nft: false,
            symbol,
            name,
            iconURL
          });
        } else {
          const { token, id: tokenId, metadata } = transfer.total.token_instance;
          const {
            address_hash: address,
            symbol,
            name: tokenName,
            decimals: rawDecimals,
            icon_url: iconFallback
          } = token;
          const { image: metadataImage } = metadata ?? {};
          const decimals = rawDecimals ? Number(rawDecimals) : undefined;
          const iconURL = metadataImage ?? iconFallback;

          asset = nullToUndefined({
            contract: address,
            tokenId,
            amountSigned: isSending ? `-${amountNotSigned}` : amountNotSigned,
            decimals,
            nft: true,
            symbol,
            name: tokenName,
            iconURL
          });
        }

        return {
          kind: ActivityOperKindEnum.transfer,
          fromAddress: from.hash,
          toAddress: to.hash,
          asset,
          logIndex,
          type: equalsIgnoreCase(from.hash, accountAddress)
            ? ActivityOperTransferType.sendToAccount
            : ActivityOperTransferType.receiveFromAccount
        };
      };
      const getApprovals = async (tx: EtherlinkTransaction) => {
        const logEntries = await fetchAllTxLogs({ chainId, txHash: tx.hash, signal });
        console.log('oy vey 8', tx, logEntries);

        return logEntries
          .filter(
            ({ decoded, topics }) =>
              [erc20ApprovalEventRegex, erc721SingleApprovalEventRegex].some(regex =>
                decoded?.method_call.match(regex)
              ) && equalsIgnoreCase(topics[1] ? `0x${topics[1].slice(-40)}` : undefined, accountAddress)
          )
          .map(logEntry => {
            const { topics, index: logIndex, data, address } = logEntry;
            const { hash: tokenAddress } = address;

            return parseApprovalLog({ topics: topics.filter(isDefined), logIndex, data, address: tokenAddress });
          });
      };
      const makeGasTokenTransfer = (tx: EtherlinkTransaction | EtherlinkInternalTx): EvmOperation => {
        const { from, to, value } = tx;
        const { hash: fromAddress } = from;
        const isSending = equalsIgnoreCase(fromAddress, accountAddress);

        return {
          kind: ActivityOperKindEnum.transfer,
          fromAddress: fromAddress,
          toAddress: to?.hash ?? EVM_ZERO_ADDRESS,
          asset: { ...gasAsset, amountSigned: isSending ? `-${value}` : value },
          logIndex: 'position' in tx ? tx.position : tx.index,
          type: isSending ? ActivityOperTransferType.sendToAccount : ActivityOperTransferType.receiveFromAccount
        };
      };

      for (const hash in rawActivitiesByHash) {
        const { tx, tokensTransfers, nativeCoinDelta } = rawActivitiesByHash[hash];
        let operations: EvmOperation[];
        if (tx) {
          const { to, position, raw_input, value } = tx;
          const toAddress = to?.hash;

          const operationKind = getOperationKind({ data: raw_input, to: toAddress, value: BigInt(value) });
          operations = [];
          const gasTokenTransfer = makeGasTokenTransfer(tx);
          const fallbackOperations: EvmOperation[] = [
            {
              kind: ActivityOperKindEnum.interaction,
              logIndex: position,
              withAddress: toAddress,
              asset: Number(value) > 0 ? { ...gasAsset, amountSigned: `-${value}` } : undefined
            }
          ];

          switch (operationKind) {
            case EvmOperationKind.DeployContract:
              operations = tokensTransfers.map(parseTokenTransfer).concat(fallbackOperations);
              break;
            case EvmOperationKind.Send:
            case EvmOperationKind.Mint:
              if (raw_input === '0x') {
                operations = [gasTokenTransfer];
                break;
              }
              operations = tokensTransfers.map(parseTokenTransfer);
              if (Number(value)) {
                operations.unshift(gasTokenTransfer);
              }
              break;
            case EvmOperationKind.Approval:
              const approvals = await getApprovals(tx);
              operations = approvals.length ? approvals : fallbackOperations;
              break;
            case EvmOperationKind.ApprovalForAll:
              operations = [{ kind: ActivityOperKindEnum.interaction, logIndex: position, withAddress: toAddress }];
              break;
            default:
              const hasGasTokenReceiveOperations = BigInt(nativeCoinDelta) + BigInt(value) > BigInt(0);
              if (tokensTransfers.length || hasGasTokenReceiveOperations) {
                let gasTokenReceiveOperations: EvmOperation[] = [];
                if (hasGasTokenReceiveOperations) {
                  const internalOperations = await fetchAllInternalTransactions({
                    txHash: tx.hash,
                    chainId,
                    signal
                  });
                  gasTokenReceiveOperations = internalOperations
                    .filter(({ to, value }) => equalsIgnoreCase(to?.hash, accountAddress) && Number(value) > 0)
                    .map(operation => makeGasTokenTransfer(operation));
                  console.log('oy vey 9', tx.hash, gasTokenReceiveOperations);
                }

                operations = tokensTransfers.map(parseTokenTransfer).concat(gasTokenReceiveOperations);
              } else {
                const approvalOperations = await getApprovals(tx);
                operations = approvalOperations.length ? approvalOperations : fallbackOperations;
              }
              if (Number(value)) {
                operations.unshift(gasTokenTransfer);
              }
          }
        } else {
          operations = tokensTransfers.map(parseTokenTransfer);
        }
        operations.sort((a, b) => a.logIndex - b.logIndex);

        activitiesByHash[hash] = {
          chain: TempleChainKind.EVM,
          hash: tx?.hash ?? tokensTransfers[0].transaction_hash,
          operationsCount: operations.length,
          /** ISO string */
          addedAt: (tx ?? tokensTransfers[0]).timestamp,
          status: tx?.status === 'error' ? ActivityStatus.failed : ActivityStatus.applied,
          chainId,
          operations,
          blockHeight: `${(tx ?? tokensTransfers[0]).block_number}`,
          index: tx?.position ?? null,
          fee: tx ? tx.fee?.value ?? '0' : null,
          value: tx?.value ?? null
        };
      }

      return {
        allActivities: Object.values(activitiesByHash).sort(
          ({ blockHeight: aLevel, index: aIndex }, { blockHeight: bLevel, index: bIndex }) =>
            Number(aLevel) === Number(bLevel) ? (bIndex ?? 0) - (aIndex ?? 0) : Number(bLevel) - Number(aLevel)
        ),
        nextPageParams: {
          operationsPageParams: explicitOperationsNextPageParams,
          tokensTransfersPageParams: tokensTransfersNextPageParams
        },
        assetsMetadata
      };
    },
    getAllNewItems: response => response.allActivities,
    getNewContractMatchItems: response =>
      contractAddress
        ? response.allActivities.filter(activity =>
            activity.operations.some(op => equalsIgnoreCase(op.asset?.contract, contractAddress))
          )
        : response.allActivities,
    getAssetsMetadata: response => response.assetsMetadata,
    getReachedTheEnd: ({ nextPageParams }) =>
      nextPageParams.operationsPageParams === null && nextPageParams.tokensTransfersPageParams === null,
    isGenesisBlockPointer: pointer => getBlockNumberFromOlderThan(pointer) === 0,
    getActivities: interval => interval.activities,
    getNewOlderThan: ({ activities }) => {
      // TODO: replace mock values
      if (activities.length === 0) {
        return {
          operationsPageParams: {
            block_number: 0,
            fee: '0',
            hash: '0x37628d45dcd6265c969aa5f5dc3fe8fddd21198c683b85ac7099d8e39597df50',
            index: 0,
            inserted_at: '2024-05-02T13:24:54.000Z',
            items_count: Number.MAX_SAFE_INTEGER,
            value: '0'
          },
          tokensTransfersPageParams: {
            block_number: 0,
            index: 0
          }
        };
      }

      const { blockHeight, hash, addedAt, operations } = activities.at(-1)!;
      const { logIndex } = operations.at(-1)!;

      return {
        operationsPageParams: {
          block_number: Number(blockHeight),
          fee: '0',
          hash,
          index: logIndex,
          inserted_at: addedAt,
          items_count: 0,
          value: '0'
        },
        tokensTransfersPageParams: {
          block_number: Number(blockHeight),
          index: logIndex
        }
      };
    },
    canUseCachedInterval: (interval, currentOlderThan) => interval.newestBlockHeight === Number(currentOlderThan) - 1,
    putNewActivities: (_, allActivities, currentOlderThan) => {
      const blockNumber = getBlockNumberFromOlderThan(currentOlderThan);

      return putEvmActivities({
        activities: allActivities,
        chainId,
        account: accountAddress,
        olderThanBlockHeight: isDefined(blockNumber) ? `${blockNumber}` : undefined
      });
    },
    signal,
    olderThan
  });
};

interface FetchTezosActivitiesWithCacheConfig {
  chainId: TempleTezosChainId;
  rpcBaseURL: string;
  accountAddress: string;
  assetSlug?: string;
  signal: AbortSignal;
  olderThan?: TezosActivityOlderThan;
}

const TEZOS_ACTIVITIES_PSEUDO_LIMIT = 30;
export const fetchTezosActivitiesWithCache = async ({
  chainId,
  rpcBaseURL,
  accountAddress,
  assetSlug,
  signal,
  olderThan
}: FetchTezosActivitiesWithCacheConfig) =>
  fetchActivitiesWithCache<TezosActivityOlderThan, GetTezosActivitiesIntervalResult, TezosActivity>({
    getClosestActivitiesInterval: currentOlderThan =>
      getClosestTezosActivitiesInterval({
        olderThan: currentOlderThan,
        chainId,
        account: accountAddress,
        assetSlug,
        maxItems: TEZOS_ACTIVITIES_PSEUDO_LIMIT
      }),
    fetchActivities: async currentOlderThan => {
      const operations = await fetchOperations(
        chainId,
        rpcBaseURL,
        accountAddress,
        assetSlug,
        TEZOS_ACTIVITIES_PSEUDO_LIMIT,
        olderThan
      );
      const hashes = filterUnique(operations.map(({ hash }) => hash));
      const alreadyKnownActivities = await getSeparateTezosActivities(chainId, accountAddress, hashes);
      const alreadyKnownActivitiesByHashes = Object.fromEntries(
        alreadyKnownActivities.map(activity => [activity.hash, activity])
      );

      const newHashes = hashes.filter(hash => !alreadyKnownActivitiesByHashes[hash]);
      const newGroups = await fetchOperGroupsForOperations(chainId, newHashes, currentOlderThan);
      const newActivitiesByHashes = Object.fromEntries(
        newGroups.map(group => [group.hash, parseTezosOperationsGroup(group, chainId, accountAddress)])
      );

      return hashes.map(hash => alreadyKnownActivitiesByHashes[hash] ?? newActivitiesByHashes[hash]);
    },
    getNewContractMatchItems: response => response,
    isGenesisBlockPointer: pointer => compareTezosIntervalLimits(tezosLowestIntervalLimit, pointer) === 0,
    getActivities: interval => interval.activities,
    getNewOlderThan: interval => interval.lowerLimit,
    canUseCachedInterval: (interval, currentOlderThan) =>
      compareTezosIntervalLimits(interval.upperLimit, currentOlderThan) === 0,
    putNewActivities: (activities, _, currentOlderThan) =>
      putTezosActivities({ activities, chainId, account: accountAddress, assetSlug, olderThan: currentOlderThan }),
    signal,
    olderThan
  });
