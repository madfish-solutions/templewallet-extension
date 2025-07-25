import { isDefined } from '@rnw-community/shared';
import { omit } from 'lodash';
import type { RequiredBy } from 'viem';

import { EvmActivity, EvmActivityAsset } from 'lib/activity';

import {
  DbEvmActivityAsset,
  EvmActivitiesInterval,
  NO_TOKEN_ID_VALUE,
  db,
  evmActivities,
  evmActivitiesIntervals,
  evmActivityAssets
} from '../db';

import { deleteEvmActivities } from './delete';

interface PutEvmActivitiesParams {
  activities: EvmActivity[];
  chainId: number;
  account: HexString;
  olderThanBlockHeight?: `${number}`;
  contractAddress?: string;
}

/**
 * Puts EVM activities into DB assuming that `activities` is a continuous history chunk. The function throws an error
 * if at least one activity is from a different chain than the specified one.
 */
export const putEvmActivities = async ({
  activities,
  chainId,
  account,
  olderThanBlockHeight,
  contractAddress = ''
}: PutEvmActivitiesParams): Promise<void> => {
  if (activities.some(({ chainId: activityChainId }) => activityChainId !== chainId)) {
    throw new Error('Activities from different chains are not allowed');
  }

  account = account.toLowerCase() as HexString;
  contractAddress = contractAddress.toLowerCase();
  activities = activities.toSorted((a, b) => Number(b.blockHeight) - Number(a.blockHeight));

  if (activities.length === 0 && !olderThanBlockHeight) {
    return;
  }

  olderThanBlockHeight = olderThanBlockHeight ?? `${Number(activities[0].blockHeight) + 1}`;
  const oldestBlockHeight = activities.length === 0 ? 0 : Number(activities.at(-1)!.blockHeight);

  if (contractAddress) {
    return overwriteEvmActivitiesByContractAddress({
      chainId,
      account,
      olderThanBlockHeight,
      oldestBlockHeight,
      contractAddress,
      activities
    });
  }

  return overwriteEvmActivitiesForAllContracts({
    chainId,
    account,
    olderThanBlockHeight,
    oldestBlockHeight,
    activities
  });
};

interface IntervalsManagementParams {
  chainId: number;
  account: HexString;
  contractAddress: string;
  olderThanBlockHeight: number;
  oldestBlockHeight: number;
}

const getSupersetInterval = async ({
  chainId,
  account,
  contractAddress,
  olderThanBlockHeight,
  oldestBlockHeight
}: IntervalsManagementParams) =>
  evmActivitiesIntervals
    .where(['chainId', 'account', 'contract', 'newestBlockHeight'])
    .between(
      [chainId, account, contractAddress, olderThanBlockHeight - 1],
      [chainId, account, contractAddress, Infinity],
      true,
      false
    )
    .and(({ oldestBlockHeight: intervalOldestBlockHeight }) => intervalOldestBlockHeight <= oldestBlockHeight)
    .first();

const getSubsetIntervalsIds = async ({
  chainId,
  account,
  contractAddress,
  olderThanBlockHeight,
  oldestBlockHeight
}: IntervalsManagementParams) =>
  evmActivitiesIntervals
    .where(['chainId', 'account', 'contract', 'oldestBlockHeight'])
    .between(
      [chainId, account, contractAddress, oldestBlockHeight],
      [chainId, account, contractAddress, olderThanBlockHeight],
      true,
      false
    )
    .and(interval => interval.newestBlockHeight < olderThanBlockHeight)
    .primaryKeys();

const handleIntervalsJoins = async ({
  chainId,
  account,
  contractAddress,
  olderThanBlockHeight,
  oldestBlockHeight
}: IntervalsManagementParams) => {
  const newerIntervalToJoinCollection = evmActivitiesIntervals
    .where(['chainId', 'account', 'contract', 'oldestBlockHeight'])
    .between(
      [chainId, account, contractAddress, oldestBlockHeight],
      [chainId, account, contractAddress, olderThanBlockHeight],
      true,
      true
    );
  const newerIntervalToJoinId = (await newerIntervalToJoinCollection.primaryKeys()).at(0);
  const olderIntervalToJoinCollection = evmActivitiesIntervals
    .where(['chainId', 'account', 'contract', 'newestBlockHeight'])
    .between(
      [chainId, account, contractAddress, oldestBlockHeight - 1],
      [chainId, account, contractAddress, olderThanBlockHeight],
      true,
      false
    );
  const olderIntervalToJoinId = (await olderIntervalToJoinCollection.primaryKeys()).at(0);
  const newerIntervalToJoin = isDefined(newerIntervalToJoinId)
    ? await evmActivitiesIntervals.get(newerIntervalToJoinId)
    : undefined;
  const olderIntervalToJoin = isDefined(olderIntervalToJoinId)
    ? await evmActivitiesIntervals.get(olderIntervalToJoinId)
    : undefined;
  await evmActivitiesIntervals.bulkDelete([newerIntervalToJoinId, olderIntervalToJoinId].filter(isDefined));
  await evmActivitiesIntervals.add({
    chainId,
    account,
    newestBlockHeight: newerIntervalToJoin ? newerIntervalToJoin.newestBlockHeight : olderThanBlockHeight - 1,
    oldestBlockHeight: olderIntervalToJoin ? olderIntervalToJoin.oldestBlockHeight : oldestBlockHeight,
    contract: contractAddress
  });
};

const filterRelevantActivities = (activities: EvmActivity[], olderThanBlockHeight: number, oldestBlockHeight: number) =>
  activities.filter(
    ({ blockHeight }) => Number(blockHeight) < olderThanBlockHeight && Number(blockHeight) >= oldestBlockHeight
  );

type OverwriteEvmActivitiesByContractParams = RequiredBy<
  PutEvmActivitiesParams,
  'contractAddress' | 'olderThanBlockHeight'
> & { oldestBlockHeight: number; createTransaction?: boolean; counter?: number };
const overwriteEvmActivitiesByContractAddress = ({
  activities,
  chainId,
  account,
  olderThanBlockHeight,
  oldestBlockHeight,
  contractAddress,
  createTransaction = true,
  counter = 0
}: OverwriteEvmActivitiesByContractParams): Promise<void> => {
  if (counter >= 5) {
    throw new Error('overwriteEvmActivitiesByContractAddress counter exceeded');
  }

  const doOperations = async () => {
    const parsedOlderThanBlockHeight = Number(olderThanBlockHeight);

    const supersetAllContractsInterval = await getSupersetInterval({
      chainId,
      account,
      contractAddress: '',
      olderThanBlockHeight: parsedOlderThanBlockHeight,
      oldestBlockHeight
    });

    if (supersetAllContractsInterval) {
      return;
    }

    const activitiesToDeleteCollection = evmActivities
      .where(['chainId', 'account', 'contract', 'blockHeight'])
      .between(
        [chainId, account, contractAddress, oldestBlockHeight],
        [chainId, account, contractAddress, parsedOlderThanBlockHeight],
        true,
        false
      );
    await deleteEvmActivities(activitiesToDeleteCollection);

    const supersetInterval = await getSupersetInterval({
      chainId,
      account,
      contractAddress,
      olderThanBlockHeight: parsedOlderThanBlockHeight,
      oldestBlockHeight
    });

    if (supersetInterval) {
      return insertActivities({ activities, account, contractAddress, chainId });
    }

    const subsetIntervalsIds = await getSubsetIntervalsIds({
      chainId,
      account,
      contractAddress,
      olderThanBlockHeight: parsedOlderThanBlockHeight,
      oldestBlockHeight
    });
    await evmActivitiesIntervals.bulkDelete(subsetIntervalsIds);

    const allContractsSubsetIntervalsIds = await getSubsetIntervalsIds({
      chainId,
      account,
      contractAddress: '',
      olderThanBlockHeight: parsedOlderThanBlockHeight,
      oldestBlockHeight
    });

    if (allContractsSubsetIntervalsIds.length > 0) {
      const allContractsSubsetIntervals = (await evmActivitiesIntervals.bulkGet(
        allContractsSubsetIntervalsIds
      )) as EvmActivitiesInterval[];
      allContractsSubsetIntervals.sort((a, b) => b.newestBlockHeight - a.newestBlockHeight);
      for (let i = 0; i <= allContractsSubsetIntervalsIds.length; i++) {
        const newIntervalOlderThanBlockHeight =
          i === 0 ? parsedOlderThanBlockHeight : allContractsSubsetIntervals[i - 1].oldestBlockHeight;
        const newIntervalOldestBlockHeight =
          i === allContractsSubsetIntervalsIds.length
            ? oldestBlockHeight
            : allContractsSubsetIntervals[i].newestBlockHeight + 1;
        if (newIntervalOlderThanBlockHeight > newIntervalOldestBlockHeight) {
          await overwriteEvmActivitiesByContractAddress({
            chainId,
            account,
            olderThanBlockHeight: `${newIntervalOlderThanBlockHeight}`,
            oldestBlockHeight: newIntervalOldestBlockHeight,
            contractAddress,
            createTransaction: false,
            activities: filterRelevantActivities(
              activities,
              newIntervalOlderThanBlockHeight,
              newIntervalOldestBlockHeight
            ),
            counter: counter + 1
          });
        }
      }

      return;
    }

    const newerAllContractsIntersectingInterval = await evmActivitiesIntervals
      .where(['chainId', 'account', 'contract', 'oldestBlockHeight'])
      .between(
        [chainId, account, '', oldestBlockHeight],
        [chainId, account, '', parsedOlderThanBlockHeight],
        true,
        false
      )
      .first();

    if (newerAllContractsIntersectingInterval) {
      const newOlderThanBlockHeight = newerAllContractsIntersectingInterval!.oldestBlockHeight;

      return overwriteEvmActivitiesByContractAddress({
        chainId,
        account,
        olderThanBlockHeight: `${newOlderThanBlockHeight}`,
        oldestBlockHeight,
        contractAddress,
        createTransaction: false,
        activities: filterRelevantActivities(activities, newOlderThanBlockHeight, oldestBlockHeight),
        counter: counter + 1
      });
    }

    const olderAllContractsIntersectingInterval = await evmActivitiesIntervals
      .where(['chainId', 'account', 'contract', 'newestBlockHeight'])
      .between(
        [chainId, account, '', oldestBlockHeight],
        [chainId, account, '', parsedOlderThanBlockHeight],
        true,
        false
      )
      .first();

    if (isDefined(olderAllContractsIntersectingInterval)) {
      const newOldestBlockHeight = olderAllContractsIntersectingInterval.newestBlockHeight + 1;

      return overwriteEvmActivitiesByContractAddress({
        chainId,
        account,
        olderThanBlockHeight,
        oldestBlockHeight: newOldestBlockHeight,
        contractAddress,
        createTransaction: false,
        activities: filterRelevantActivities(activities, parsedOlderThanBlockHeight, newOldestBlockHeight),
        counter: counter + 1
      });
    }

    await handleIntervalsJoins({
      chainId,
      account,
      contractAddress,
      olderThanBlockHeight: parsedOlderThanBlockHeight,
      oldestBlockHeight
    });
    await insertActivities({ activities, account, contractAddress, chainId });
  };

  return createTransaction
    ? db.transaction('rw!', evmActivitiesIntervals, evmActivities, evmActivityAssets, doOperations)
    : doOperations();
};

type OverwriteEvmActivitiesForAllContractsParams = RequiredBy<
  Omit<PutEvmActivitiesParams, 'contractAddress'>,
  'olderThanBlockHeight'
> & { oldestBlockHeight?: number };
const overwriteEvmActivitiesForAllContracts = ({
  activities,
  chainId,
  account,
  olderThanBlockHeight,
  oldestBlockHeight = 0
}: OverwriteEvmActivitiesForAllContractsParams) =>
  db.transaction('rw!', evmActivitiesIntervals, evmActivities, evmActivityAssets, async () => {
    const parsedOlderThanBlockHeight = Number(olderThanBlockHeight);

    const activitiesToDeleteCollection = evmActivities
      .where(['chainId', 'account', 'blockHeight'])
      .between([chainId, account, oldestBlockHeight], [chainId, account, parsedOlderThanBlockHeight], true, false);
    await deleteEvmActivities(activitiesToDeleteCollection);
    await insertActivities({ activities, account, contractAddress: '', chainId });

    const supersetAllContractsInterval = await getSupersetInterval({
      chainId,
      account,
      contractAddress: '',
      olderThanBlockHeight: parsedOlderThanBlockHeight,
      oldestBlockHeight
    });

    if (supersetAllContractsInterval) {
      return;
    }

    const supersetIntervalsIds = await evmActivitiesIntervals
      .where(['chainId', 'account', 'oldestBlockHeight'])
      .between([chainId, account, 0], [chainId, account, oldestBlockHeight], true, true)
      .and(
        ({ newestBlockHeight: intervalNewestBlockHeight }) =>
          intervalNewestBlockHeight >= parsedOlderThanBlockHeight - 1
      )
      .primaryKeys();

    if (supersetIntervalsIds.length > 0) {
      const supersetIntervals = await evmActivitiesIntervals.bulkGet(supersetIntervalsIds);
      await evmActivitiesIntervals.bulkDelete(supersetIntervalsIds);
      await evmActivitiesIntervals.bulkAdd(
        supersetIntervals
          .map(interval => {
            const {
              oldestBlockHeight: supersetOldestBlockHeight,
              newestBlockHeight: supersetNewestBlockHeight,
              id,
              ...restProps
            } = interval!;

            return [
              {
                ...restProps,
                newestBlockHeight: supersetNewestBlockHeight,
                oldestBlockHeight: parsedOlderThanBlockHeight
              },
              {
                ...restProps,
                newestBlockHeight: oldestBlockHeight,
                oldestBlockHeight: supersetOldestBlockHeight
              }
            ];
          })
          .flat()
          .filter(({ newestBlockHeight, oldestBlockHeight }) => newestBlockHeight >= oldestBlockHeight)
      );
    }

    const subsetIntervalsIds = await evmActivitiesIntervals
      .where(['chainId', 'account', 'oldestBlockHeight'])
      .between([chainId, account, oldestBlockHeight], [chainId, account, parsedOlderThanBlockHeight], true, false)
      .and(interval => interval.newestBlockHeight < parsedOlderThanBlockHeight)
      .primaryKeys();
    await evmActivitiesIntervals.bulkDelete(subsetIntervalsIds);

    await evmActivitiesIntervals
      .where(['chainId', 'account', 'oldestBlockHeight'])
      .between([chainId, account, oldestBlockHeight], [chainId, account, parsedOlderThanBlockHeight], true, false)
      .and(interval => interval.contract !== '')
      .modify({ oldestBlockHeight: parsedOlderThanBlockHeight });

    await evmActivitiesIntervals
      .where(['chainId', 'account', 'newestBlockHeight'])
      .between([chainId, account, oldestBlockHeight], [chainId, account, parsedOlderThanBlockHeight], true, false)
      .and(interval => interval.contract !== '')
      .modify({ newestBlockHeight: oldestBlockHeight - 1 });

    await handleIntervalsJoins({
      chainId,
      account,
      contractAddress: '',
      olderThanBlockHeight: parsedOlderThanBlockHeight,
      oldestBlockHeight
    });
  });

interface InsertActivitiesParams {
  activities: EvmActivity[];
  account: HexString;
  contractAddress: string;
  chainId: number;
}

const getAssetKey = (asset: EvmActivityAsset) =>
  `${asset.contract.toLowerCase()}_${asset.tokenId ?? NO_TOKEN_ID_VALUE}`;
const insertActivities = async ({ activities, account, contractAddress, chainId }: InsertActivitiesParams) => {
  const assetsBySlug: StringRecord<DbEvmActivityAsset> = {};
  activities.forEach(({ operations }) =>
    operations.forEach(({ asset }) => {
      if (!asset) {
        return;
      }

      const key = getAssetKey(asset);
      if (!assetsBySlug[key]) {
        assetsBySlug[key] = Object.assign(omit(asset, 'amountSigned', 'tokenId'), {
          chainId,
          tokenId: asset.tokenId ?? NO_TOKEN_ID_VALUE,
          contract: asset.contract.toLowerCase()
        });
      }
    })
  );
  const assetsToEnsure = Object.values(assetsBySlug);
  const alreadyKnownAssetsCollection = evmActivityAssets
    .where(['chainId', 'contract', 'tokenId'])
    .anyOf(assetsToEnsure.map(({ chainId, contract, tokenId }) => [chainId, contract, tokenId]));
  const alreadyKnownAssetsIds = await alreadyKnownAssetsCollection.primaryKeys();
  const alreadyKnownAssets = await evmActivityAssets.bulkGet(alreadyKnownAssetsIds);
  const alreadyKnownAssetsIdsByKey = Object.fromEntries(
    alreadyKnownAssets.map((asset, i) => [getAssetKey(asset!), alreadyKnownAssetsIds[i]])
  );
  const newAssets = assetsToEnsure.filter(asset => !alreadyKnownAssetsIdsByKey[getAssetKey(asset)]);
  const newAssetsIds = await evmActivityAssets.bulkAdd(newAssets, { allKeys: true });
  const newAssetsIdsByKey = Object.fromEntries(newAssets.map((asset, i) => [getAssetKey(asset), newAssetsIds[i]]));

  await evmActivities.bulkAdd(
    activities.map(({ operations, blockHeight, ...activity }) => ({
      ...activity,
      account,
      contract: contractAddress,
      chainId,
      blockHeight: Number(blockHeight),
      operations: operations.map(({ asset, ...operation }) => {
        if (!asset) {
          return operation;
        }

        const assetKey = getAssetKey(asset);

        return {
          ...operation,
          amountSigned: asset.amountSigned,
          fkAsset: newAssetsIdsByKey[assetKey] ?? alreadyKnownAssetsIdsByKey[assetKey]
        };
      })
    }))
  );
};
