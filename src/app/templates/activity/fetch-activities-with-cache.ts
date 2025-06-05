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
  EtherlinkPageParams,
  fetchGetAccountOperations,
  fetchAllInternalTransactions,
  fetchAllInternalTokensTransfers,
  isErc20TokenTransfer,
  isErc721TokenTransfer,
  fetchGetTxLogs,
  EtherlinkTransaction
} from 'lib/apis/etherlink';
import { fromAssetSlug } from 'lib/assets';
import { toEvmAssetSlug } from 'lib/assets/utils';
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
  getSeparateTezosActivities,
  getSeparateEvmActivites
} from 'lib/temple/activity/repo';
import { DEFAULT_EVM_CHAINS_SPECS } from 'lib/temple/chains-specs';
import { TempleTezosChainId } from 'lib/temple/types';
import { filterUnique } from 'lib/utils';
import { TempleChainKind } from 'temple/types';

interface GetClosestNonEmptyActivitiesIntervalConfig<P, I, A> {
  getClosestActivitiesInterval: (olderThan: P | undefined) => Promise<I | undefined>;
  isGenesisBlockPointer: SyncFn<P, boolean>;
  getActivities: SyncFn<I, A[]>;
  getNewOlderThan: SyncFn<I, P>;
  canUseCachedInterval: (interval: I, olderThan: P) => boolean;
  signal: AbortSignal;
  olderThan?: P;
}

interface FetchActivitiesWithCacheConfig<P, I, A, TM = never, CM = never, R = A[]>
  extends GetClosestNonEmptyActivitiesIntervalConfig<P, I, A> {
  /** May we fetch assets metadata here intentionally? */
  fetchActivities: (olderThan?: P) => Promise<R>;
  getNewContractMatchItems: SyncFn<R, A[]>;
  getAllNewItems?: SyncFn<R, A[]>;
  getTokensMetadata?: SyncFn<R, StringRecord<TM>>;
  getCollectiblesMetadata?: SyncFn<R, StringRecord<CM>>;
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
const fetchActivitiesWithCache = async <P, I, A, TM = never, CM = never, R = A[]>({
  getClosestActivitiesInterval,
  fetchActivities,
  getNewContractMatchItems,
  getAllNewItems = getNewContractMatchItems,
  getTokensMetadata,
  getCollectiblesMetadata,
  getReachedTheEnd,
  isGenesisBlockPointer,
  getActivities,
  getNewOlderThan,
  canUseCachedInterval,
  putNewActivities,
  signal,
  olderThan
}: FetchActivitiesWithCacheConfig<P, I, A, TM, CM, R>) => {
  let currentOlderThan = olderThan;
  let tokensMetadata: StringRecord<TM> = {};
  let collectiblesMetadata: StringRecord<CM> = {};

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
      if (getTokensMetadata) {
        tokensMetadata = getTokensMetadata(response);
      }
      if (getCollectiblesMetadata) {
        collectiblesMetadata = getCollectiblesMetadata(response);
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

  return { activities, tokensMetadata, collectiblesMetadata, reachedTheEnd };
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
  olderThan?: EtherlinkPageParams;
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

export const fetchEtherlinkActivitiesWithCache = async ({
  chainId,
  accountAddress,
  assetSlug,
  signal,
  olderThan
}: FetchEtherlinkActivitiesWithCacheConfig) => {
  const contractAddress = assetSlug ? fromAssetSlug(assetSlug)[0] : undefined;

  return fetchActivitiesWithCache<
    EtherlinkPageParams,
    GetEvmActivitiesIntervalResult,
    EvmActivity,
    EvmTokenMetadata,
    EvmCollectibleMetadata,
    {
      allActivities: EvmActivity[];
      nextPageParams: EtherlinkPageParams | null;
      tokensMetadata: StringRecord<EvmTokenMetadata>;
      collectiblesMetadata: StringRecord<EvmCollectibleMetadata>;
    }
  >({
    getClosestActivitiesInterval: currentOlderThan =>
      getClosestEvmActivitiesInterval({
        olderThanBlockHeight: currentOlderThan ? `${currentOlderThan.block_number}` : undefined,
        chainId,
        account: accountAddress,
        contractAddress,
        maxItems: 50
      }),
    fetchActivities: async currentOlderThan => {
      const { items: transactions, nextPageParams } = await fetchGetAccountOperations(
        chainId,
        accountAddress,
        currentOlderThan,
        signal
      );
      const tokensMetadata: StringRecord<EvmTokenMetadata> = {};
      const collectiblesMetadata: StringRecord<EvmCollectibleMetadata> = {};

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
      const handleTokensTransfers = async (tx: EtherlinkTransaction) => {
        const { hash, from, position, value } = tx;
        const { hash: fromAddress } = from;
        const toAddress = tx.to?.hash;
        let operations: EvmOperation[] = [];
        const tokensTransfers = await fetchAllInternalTokensTransfers(signal, chainId, hash);
        operations = tokensTransfers
          .filter(({ from, to }) => [from, to].some(({ hash }) => equalsIgnoreCase(hash, accountAddress)))
          .map(transfer => {
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
              tokensMetadata[toEvmAssetSlug(address)] = nullToUndefined({
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
              collectiblesMetadata[toEvmAssetSlug(address, tokenId)] = nullToUndefined({
                symbol,
                address,
                name: tokenName,
                decimals,
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
          });

        if (equalsIgnoreCase(fromAddress, accountAddress) && Number(value) > 0) {
          operations.unshift({
            kind: ActivityOperKindEnum.transfer,
            fromAddress,
            toAddress: toAddress!,
            asset: { ...gasAsset, amountSigned: `-${value}` },
            logIndex: position,
            type: ActivityOperTransferType.sendToAccount
          });
        }

        return operations;
      };
      const getApprovals = async (tx: EtherlinkTransaction) => {
        const { items: logEntries } = await fetchGetTxLogs(chainId, tx.hash, null, signal);

        return logEntries
          .filter(
            ({ decoded, topics }) =>
              [erc20ApprovalEventRegex, erc721SingleApprovalEventRegex].some(regex =>
                decoded?.method_call.match(regex)
              ) && equalsIgnoreCase(topics[1] ?? undefined, accountAddress)
          )
          .map(logEntry => {
            const { topics, index: logIndex, data, address } = logEntry;
            const { hash: tokenAddress } = address;

            return parseApprovalLog({ topics: topics.filter(isDefined), logIndex, data, address: tokenAddress });
          });
      };

      const hashes = transactions.map(op => op.hash);
      const alreadyKnownActivities = await getSeparateEvmActivites(chainId, accountAddress, hashes);
      const alreadyKnownActivitiesByHashes = Object.fromEntries(
        alreadyKnownActivities.map(activity => [activity.hash, activity])
      );

      const newOperationsByHash = transactions.reduce<Record<string, EtherlinkTransaction>>((acc, operation) => {
        const { hash } = operation;
        if (!alreadyKnownActivitiesByHashes[hash]) {
          acc[hash] = operation;
        }

        return acc;
      }, {});

      const newActivities = await Promise.all(
        Object.keys(newOperationsByHash).map(async (hash): Promise<EvmActivity> => {
          const transaction = newOperationsByHash[hash];
          const { from, to, fee, position, raw_input, block_number, timestamp, status, value } = transaction;
          const { hash: fromAddress } = from;
          const toAddress = to?.hash;
          const basicActivityProps = {
            chain: TempleChainKind.EVM as const,
            hash,
            addedAt: timestamp,
            status: status === 'ok' ? ActivityStatus.applied : ActivityStatus.failed,
            chainId,
            blockHeight: `${block_number}` as const
          };

          const operationKind = getOperationKind({ data: raw_input, to: toAddress });
          let operations: EvmOperation[] = [];

          const isSending = equalsIgnoreCase(fromAddress, accountAddress);
          const gasTokenTransfer: EvmOperation = {
            kind: ActivityOperKindEnum.transfer,
            fromAddress,
            toAddress: toAddress!,
            asset: { ...gasAsset, amountSigned: isSending ? `-${value}` : value },
            logIndex: position,
            type: isSending ? ActivityOperTransferType.sendToAccount : ActivityOperTransferType.receiveFromAccount
          };
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
              operations = fallbackOperations;
              break;
            case EvmOperationKind.Send:
            case EvmOperationKind.Mint:
              if (raw_input === '0x') {
                operations = [gasTokenTransfer];
                break;
              }
              operations = await handleTokensTransfers(transaction);
              break;
            case EvmOperationKind.Approval:
              const approvals = await getApprovals(transaction);
              operations = approvals.length ? approvals : fallbackOperations;
              break;
            case EvmOperationKind.ApprovalForAll:
              operations = [{ kind: ActivityOperKindEnum.interaction, logIndex: position, withAddress: toAddress }];
              break;
            default:
              const tokensOperations = await handleTokensTransfers(transaction);
              const gasTokenReceiveOperations = (await fetchAllInternalTransactions(signal, chainId, hash))
                .filter(({ to, value }) => equalsIgnoreCase(to?.hash, accountAddress) && Number(value) > 0)
                .map(
                  ({ value, from, index }): EvmOperation => ({
                    kind: ActivityOperKindEnum.transfer,
                    type: ActivityOperTransferType.receiveFromAccount,
                    fromAddress: from.hash,
                    toAddress: accountAddress,
                    logIndex: index,
                    asset: { ...gasAsset, amountSigned: value }
                  })
                );
              // Actually, an operation may contain both transfers and approvals for the account but chances are low
              if (tokensOperations.length || gasTokenReceiveOperations.length) {
                operations = tokensOperations.concat(gasTokenReceiveOperations);
              } else {
                const approvalOperations = await getApprovals(transaction);
                operations = approvalOperations.length ? approvalOperations : fallbackOperations;
              }
              operations.sort((a, b) => a.logIndex - b.logIndex);
          }

          return {
            ...basicActivityProps,
            operationsCount: operations.length,
            operations,
            value,
            index: position,
            fee: fee?.value ?? null
          };
        })
      );
      const newActivitiesByHashes = Object.fromEntries(newActivities.map(activity => [activity.hash, activity]));

      return {
        allActivities: hashes.map(hash => alreadyKnownActivitiesByHashes[hash] ?? newActivitiesByHashes[hash]),
        nextPageParams,
        tokensMetadata,
        collectiblesMetadata
      };
    },
    getAllNewItems: response => response.allActivities,
    getNewContractMatchItems: response =>
      contractAddress
        ? response.allActivities.filter(activity =>
            activity.operations.some(op => equalsIgnoreCase(op.asset?.contract, contractAddress))
          )
        : response.allActivities,
    getTokensMetadata: response => response.tokensMetadata,
    getCollectiblesMetadata: response => response.collectiblesMetadata,
    getReachedTheEnd: response => response.nextPageParams === null,
    isGenesisBlockPointer: pointer => pointer.block_number === 0,
    getActivities: interval => interval.activities,
    getNewOlderThan: ({ activities }) => {
      // TODO: replace mock values
      if (activities.length === 0) {
        return {
          block_number: 0,
          fee: '0',
          hash: '0x37628d45dcd6265c969aa5f5dc3fe8fddd21198c683b85ac7099d8e39597df50',
          index: 0,
          inserted_at: '2024-05-02T13:24:54.000Z',
          items_count: Number.MAX_SAFE_INTEGER,
          value: '0'
        };
      }

      const { blockHeight, hash, addedAt, operations } = activities.at(-1)!;
      const { logIndex } = operations.at(-1)!;

      return {
        block_number: Number(blockHeight),
        fee: '0',
        hash,
        index: logIndex,
        inserted_at: addedAt,
        items_count: 0,
        value: '0'
      };
    },
    canUseCachedInterval: (interval, currentOlderThan) => interval.newestBlockHeight === Number(currentOlderThan) - 1,
    putNewActivities: (_, allActivities, currentOlderThan) =>
      putEvmActivities({
        activities: allActivities,
        chainId,
        account: accountAddress,
        olderThanBlockHeight: currentOlderThan ? `${currentOlderThan.block_number}` : undefined
      }),
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
