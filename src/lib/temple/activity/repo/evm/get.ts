import { isDefined } from '@rnw-community/shared';
import { Collection } from 'dexie';

import { EvmActivity } from 'lib/activity';
import { filterUnique } from 'lib/utils';

import {
  DbEvmActivity,
  EvmActivitiesInterval,
  db,
  evmActivities,
  evmActivitiesIntervals,
  evmActivityAssets
} from '../db';

import { toFrontEvmActivity } from './utils';

interface GetEvmActivitiesIntervalParams {
  olderThanBlockHeight?: `${number}`;
  chainId: number;
  account: HexString;
  contractAddress?: string;
  maxItems?: number;
}

export interface GetEvmActivitiesIntervalResult {
  activities: EvmActivity[];
  newestBlockHeight: number;
  oldestBlockHeight: number;
}

export const getClosestEvmActivitiesInterval = async ({
  olderThanBlockHeight,
  chainId,
  account,
  contractAddress = '',
  maxItems = Infinity
}: GetEvmActivitiesIntervalParams): Promise<GetEvmActivitiesIntervalResult | undefined> =>
  db.transaction('r!', evmActivities, evmActivitiesIntervals, evmActivityAssets, async () => {
    account = account.toLowerCase() as HexString;
    contractAddress = contractAddress.toLowerCase();

    let allContractsIntervalsCollection: Collection<EvmActivitiesInterval>;
    let intervalsByContractCollection: Collection<EvmActivitiesInterval> | undefined;
    if (olderThanBlockHeight) {
      allContractsIntervalsCollection = evmActivitiesIntervals
        .where(['chainId', 'account', 'contract', 'oldestBlockHeight'])
        .between([chainId, account, '', 0], [chainId, account, '', Number(olderThanBlockHeight)], true, false);
      intervalsByContractCollection = contractAddress
        ? evmActivitiesIntervals
            .where(['chainId', 'account', 'contract', 'oldestBlockHeight'])
            .between(
              [chainId, account, contractAddress, 0],
              [chainId, account, contractAddress, Number(olderThanBlockHeight)]
            )
        : undefined;
    } else {
      allContractsIntervalsCollection = evmActivitiesIntervals.where({ chainId, account, contract: '' });
      intervalsByContractCollection = contractAddress
        ? evmActivitiesIntervals.where({ chainId, account, contract: contractAddress })
        : undefined;
    }
    const allContractsIntervals = await allContractsIntervalsCollection.reverse().sortBy('newestBlockHeight');
    const intervalsByContract = intervalsByContractCollection
      ? await intervalsByContractCollection.reverse().sortBy('newestBlockHeight')
      : [];
    const interval =
      intervalsByContract[0] &&
      (!allContractsIntervals[0] ||
        intervalsByContract[0].newestBlockHeight > allContractsIntervals[0].newestBlockHeight)
        ? intervalsByContract[0]
        : allContractsIntervals[0];

    if (!interval) {
      return;
    }

    let oldestBlockHeight = interval.oldestBlockHeight;
    const { newestBlockHeight, contract: intervalContractAddress } = interval;
    const searchNewestBlockHeight = Math.min(newestBlockHeight, Number(olderThanBlockHeight ?? Infinity) - 1);
    const allRawActivitiesCollection = evmActivities
      .where(['chainId', 'account', 'contract', 'blockHeight'])
      .between(
        [chainId, account, intervalContractAddress, oldestBlockHeight],
        [chainId, account, intervalContractAddress, searchNewestBlockHeight],
        true,
        true
      )
      .reverse();
    let rawActivities: DbEvmActivity[];
    if (Number.isInteger(maxItems) && maxItems > 0) {
      rawActivities = await allRawActivitiesCollection.limit(maxItems).sortBy('blockHeight');
      if (rawActivities.length > 0) {
        oldestBlockHeight = rawActivities.at(-1)!.blockHeight;
      }
    } else {
      rawActivities = await allRawActivitiesCollection.sortBy('blockHeight');
    }
    const assetsIds = filterUnique(
      rawActivities
        .map(({ operations }) => operations.map(({ fkAsset }) => fkAsset))
        .flat()
        .filter(isDefined)
    );
    const assets = await evmActivityAssets.bulkGet(assetsIds);
    const idsToAssets = Object.fromEntries(assets.map((asset, i) => [assetsIds[i], asset]));

    return {
      activities: rawActivities
        .map(activity => {
          if (!contractAddress) {
            return toFrontEvmActivity(activity, idsToAssets);
          }

          const { operations, ...restProps } = toFrontEvmActivity(activity, idsToAssets);

          return {
            ...restProps,
            operations: operations.filter(operation => operation.asset?.contract.toLowerCase() === contractAddress)
          };
        })
        .filter(({ operations }) => operations.length > 0),
      newestBlockHeight: searchNewestBlockHeight,
      oldestBlockHeight
    };
  });
