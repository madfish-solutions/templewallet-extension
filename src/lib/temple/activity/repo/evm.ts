import { isDefined } from '@rnw-community/shared';
import { Collection } from 'dexie';
import { omit, uniq, uniqBy } from 'lodash';

import { EvmActivity, EvmActivityAsset, EvmOperation } from 'lib/activity';

import { DbEvmActivity, NO_TOKEN_ID_VALUE, db, evmActivities, evmActivitiesIntervals, evmActivityAssets } from './db';

export const getClosestEvmActivitiesInterval = async (
  olderThanBlockHeight: `${number}` | undefined,
  chainId: number,
  account: HexString
): Promise<{ activities: EvmActivity[]; newestBlockHeight: number; oldestBlockHeight: number }> =>
  db.transaction('r!', evmActivities, evmActivitiesIntervals, evmActivityAssets, async () => {
    account = account.toLowerCase() as HexString;

    const intervalCollection = olderThanBlockHeight
      ? evmActivitiesIntervals
          .where(['chainId', 'account', 'oldestBlockHeight'])
          .between([chainId, account, 0], [chainId, account, Number(olderThanBlockHeight)])
      : evmActivitiesIntervals.where({ chainId, account });
    const interval = (await intervalCollection.reverse().sortBy('oldestBlockHeight'))[0];

    if (!interval) {
      return {
        activities: [],
        newestBlockHeight: olderThanBlockHeight ? Number(olderThanBlockHeight) : 0,
        oldestBlockHeight: olderThanBlockHeight ? Number(olderThanBlockHeight) : 0
      };
    }

    const { oldestBlockHeight, newestBlockHeight } = interval;
    const rawActivities = await evmActivities
      .where(['chainId', 'blockHeight'])
      .between(
        [chainId, oldestBlockHeight],
        [chainId, Math.min(newestBlockHeight, Number(olderThanBlockHeight ?? Infinity) - 1)],
        true,
        true
      )
      .and(({ accounts }) => accounts.includes(account))
      .reverse()
      .sortBy('blockHeight');
    const assetsIds = uniq(
      rawActivities
        .map(({ operations }) => operations.map(({ fkAsset }) => fkAsset))
        .flat()
        .filter(isDefined)
    );
    const assets = await evmActivityAssets.bulkGet(assetsIds);
    const idsToAssets = Object.fromEntries(
      assets.map((asset, i) => [
        assetsIds[i],
        asset
          ? Object.assign(
              {},
              omit(asset, 'tokenId', 'id', 'chainId'),
              asset.tokenId === NO_TOKEN_ID_VALUE ? {} : { tokenId: asset.tokenId }
            )
          : undefined
      ])
    );

    return {
      activities: rawActivities.map(({ operations, blockHeight, id, accounts, ...activity }) => ({
        ...activity,
        blockHeight: `${blockHeight}`,
        operations: operations.map(({ fkAsset, amountSigned, ...operation }) => ({
          ...operation,
          asset: isDefined(fkAsset) ? { ...idsToAssets[fkAsset], amountSigned } : undefined
        })) as EvmOperation[]
      })),
      newestBlockHeight: Math.min(newestBlockHeight, Number(olderThanBlockHeight ?? Infinity) - 1),
      oldestBlockHeight
    };
  });

const getAssetKey = (asset: EvmActivityAsset) => `${asset.contract}_${asset.tokenId}`;

/**
 * Puts EVM activities into DB assuming that `activities` is a continuous history chunk. The function throws an error
 * if at least one activity is from a different chain than the specified one.
 */
export const putEvmActivities = async (
  activities: EvmActivity[],
  chainId: number,
  account: HexString,
  olderThanBlockHeight: `${number}` | undefined
): Promise<void> => {
  account = account.toLowerCase() as HexString;

  if (activities.length === 0 && olderThanBlockHeight) {
    return db.transaction('rw!', evmActivitiesIntervals, evmActivities, evmActivityAssets, async () => {
      const sameBlocksActivitiesCollection = evmActivities
        .where(['chainId', 'blockHeight'])
        .between([chainId, 0], [chainId, Number(olderThanBlockHeight)], true, false)
        .and(({ accounts }) => accounts.includes(account));
      await deleteEvmActivitiesForAccount(sameBlocksActivitiesCollection, account);

      const supersetInterval = await evmActivitiesIntervals
        .where({ chainId, account })
        .and(
          interval => interval.newestBlockHeight >= Number(olderThanBlockHeight) - 1 && interval.oldestBlockHeight === 0
        )
        .first();

      if (supersetInterval) {
        return;
      }

      const newerIntervalToJoinCollection = olderThanBlockHeight
        ? evmActivitiesIntervals
            .where(['chainId', 'account', 'oldestBlockHeight'])
            .between([chainId, account, 0], [chainId, account, Number(olderThanBlockHeight)], true, true)
        : undefined;
      const newerIntervalToJoinId = newerIntervalToJoinCollection
        ? (await newerIntervalToJoinCollection.primaryKeys())[0]
        : undefined;
      const newerIntervalToJoin = isDefined(newerIntervalToJoinId)
        ? await evmActivitiesIntervals.get(newerIntervalToJoinId)
        : undefined;

      if (isDefined(newerIntervalToJoinId)) {
        await evmActivitiesIntervals.delete(newerIntervalToJoinId);
        await evmActivitiesIntervals.add({
          chainId,
          account,
          newestBlockHeight: newerIntervalToJoin!.newestBlockHeight,
          oldestBlockHeight: 0
        });
      } else {
        await evmActivitiesIntervals.add({
          chainId,
          account,
          newestBlockHeight: Number(olderThanBlockHeight) - 1,
          oldestBlockHeight: 0
        });
      }
    });
  }

  if (activities.length === 0) {
    return;
  }

  if (activities.some(({ chainId: activityChainId }) => activityChainId !== chainId)) {
    throw new Error('There is an activity from a different chain');
  }

  const oldestActivityBlockHeight = Number(activities.at(-1)?.blockHeight);
  const newestActivityBlockHeight = Number(activities[0].blockHeight);
  const separateIntervalNewestBlockHeight = Math.max(newestActivityBlockHeight, Number(olderThanBlockHeight ?? 0) - 1);

  return db.transaction('rw!', evmActivities, evmActivitiesIntervals, evmActivityAssets, async () => {
    const sameBlocksActivitiesCollection = evmActivities
      .where(['chainId', 'blockHeight'])
      .between([chainId, oldestActivityBlockHeight], [chainId, separateIntervalNewestBlockHeight], true, true)
      .and(({ accounts }) => accounts.includes(account));
    await deleteEvmActivitiesForAccount(sameBlocksActivitiesCollection, account);

    const supersetInterval = await evmActivitiesIntervals
      .where({ chainId, account })
      .and(
        interval =>
          interval.newestBlockHeight >= separateIntervalNewestBlockHeight &&
          interval.oldestBlockHeight <= oldestActivityBlockHeight
      )
      .first();

    if (!supersetInterval) {
      const newerIntervalToJoinCollection = olderThanBlockHeight
        ? evmActivitiesIntervals
            .where({ chainId, account })
            .and(
              interval =>
                interval.oldestBlockHeight <= Number(olderThanBlockHeight) &&
                interval.newestBlockHeight >= separateIntervalNewestBlockHeight
            )
        : undefined;
      const newerIntervalToJoinId = newerIntervalToJoinCollection
        ? (await newerIntervalToJoinCollection.primaryKeys())[0]
        : undefined;
      const newerIntervalToJoin = isDefined(newerIntervalToJoinId)
        ? await evmActivitiesIntervals.get(newerIntervalToJoinId)
        : undefined;

      const olderIntervalToJoinCollection = evmActivitiesIntervals
        .where({ chainId, account })
        .and(
          interval =>
            interval.newestBlockHeight >= oldestActivityBlockHeight - 1 &&
            interval.oldestBlockHeight <= oldestActivityBlockHeight
        );
      const olderIntervalToJoinId = (await olderIntervalToJoinCollection.primaryKeys())[0];
      const olderIntervalToJoin = isDefined(olderIntervalToJoinId)
        ? await evmActivitiesIntervals.get(olderIntervalToJoinId)
        : undefined;

      await evmActivitiesIntervals.bulkDelete([newerIntervalToJoinId, olderIntervalToJoinId].filter(isDefined));
      await evmActivitiesIntervals.add({
        chainId,
        account,
        newestBlockHeight: newerIntervalToJoin
          ? newerIntervalToJoin.newestBlockHeight
          : separateIntervalNewestBlockHeight,
        oldestBlockHeight: olderIntervalToJoin ? olderIntervalToJoin.oldestBlockHeight : oldestActivityBlockHeight
      });
    }

    const assets = uniqBy(
      activities
        .map(({ operations }) => operations)
        .flat()
        .map(({ asset }) => asset)
        .filter(isDefined),
      asset => getAssetKey(asset)
    );
    const alreadyPresentAssetsCollection = evmActivityAssets
      .where(['chainId', 'contract', 'tokenId'])
      .anyOf(assets.map(asset => [chainId, asset.contract, asset.tokenId ?? NO_TOKEN_ID_VALUE] as const));
    const alreadyPresentAssets = await alreadyPresentAssetsCollection.toArray();
    const alreadyPresentAssetsIds = await alreadyPresentAssetsCollection.primaryKeys();
    const alreadyPresentAssetsKeys = Object.fromEntries(alreadyPresentAssets.map(asset => [getAssetKey(asset), true]));
    const newAssets = assets.filter(asset => !alreadyPresentAssetsKeys[getAssetKey(asset)]);
    const newAssetsIds = await evmActivityAssets.bulkPut(
      newAssets.map(({ amountSigned, ...asset }) => ({
        ...asset,
        chainId,
        tokenId: asset.tokenId ?? NO_TOKEN_ID_VALUE
      })),
      { allKeys: true }
    );

    const assetsKeysToIdsMap = Object.assign(
      Object.fromEntries(alreadyPresentAssets.map((asset, i) => [getAssetKey(asset), alreadyPresentAssetsIds[i]])),
      Object.fromEntries(newAssets.map((asset, i) => [getAssetKey(asset), newAssetsIds[i]]))
    );

    // TODO: implement putting and updating activities
    const alreadyPresentActivitiesCollection = evmActivities
      .where(['hash', 'chainId'])
      .anyOf(activities.map(({ hash }) => [hash, chainId]));
    const alreadyPresentActivitiesIds = await alreadyPresentActivitiesCollection.primaryKeys();
    const alreadyPresentActivities = await alreadyPresentActivitiesCollection.toArray();
    const alreadyPresentActivitiesKeys = Object.fromEntries(
      alreadyPresentActivities.map(({ hash, chainId }) => [`${hash}_${chainId}`, true])
    );
    const newActivities = activities.filter(({ hash }) => !alreadyPresentActivitiesKeys[`${hash}_${chainId}`]);

    await evmActivities.bulkUpdate(
      alreadyPresentActivitiesIds.map((id, i) => ({
        key: id,
        changes: { accounts: alreadyPresentActivities[i].accounts.concat(account) }
      }))
    );
    await evmActivities.bulkPut(
      newActivities.map(({ operations, blockHeight, ...activity }) => ({
        ...activity,
        accounts: [account],
        chainId,
        blockHeight: Number(blockHeight),
        operations: operations.map(({ asset, ...operation }) => ({
          ...operation,
          fkAsset: asset && assetsKeysToIdsMap[getAssetKey(omit(asset, 'amountSigned'))],
          amountSigned: asset?.amountSigned
        }))
      }))
    );
  });
};

export const removeEvmActivitiesByAddress = async (account: HexString) =>
  db.transaction('rw!', evmActivities, evmActivitiesIntervals, evmActivityAssets, async () => {
    const intervalIds = await evmActivitiesIntervals.where('account').equals(account).primaryKeys();
    await evmActivitiesIntervals.bulkDelete(intervalIds);
    const activityIdsCollection = evmActivities.filter(({ accounts }) => accounts.includes(account));
    await deleteEvmActivitiesForAccount(activityIdsCollection, account);
  });

const deleteEvmActivitiesForAccount = async (
  activitiesCollection: Collection<DbEvmActivity, number, DbEvmActivity>,
  account: HexString
) => {
  const activitiesIds = await activitiesCollection.primaryKeys();
  const activities = await activitiesCollection.toArray();
  const activitiesWithIds = activitiesIds.map((id, i) => [id, activities[i]] as const);
  const activitiesForCompleteRemoval = activitiesWithIds.filter(([, activity]) => {
    const { accounts } = activity;

    return accounts.length === 1 && accounts[0] === account;
  });
  const activitiesForModification = activitiesWithIds.filter(([, activity]) => {
    const { accounts } = activity;

    return accounts.length > 1 && accounts.includes(account);
  });
  await evmActivities.bulkDelete(activitiesForCompleteRemoval.map(([id]) => id));
  await evmActivities.bulkUpdate(
    activitiesForModification.map(([id, activity]) => ({
      key: id,
      changes: { accounts: activity.accounts.filter(a => a !== account) }
    }))
  );
  const activityAssetsIdsToRemoveCandidates = uniq(
    activitiesForCompleteRemoval
      .map(([, { operations }]) => operations.map(({ fkAsset }) => fkAsset))
      .flat()
      .filter(isDefined)
  );
  const candidatesDictionary = Object.fromEntries(activityAssetsIdsToRemoveCandidates.map(id => [id, true]));
  const usingActivities = await evmActivities
    .filter(({ operations }) => operations.some(({ fkAsset }) => fkAsset && candidatesDictionary[fkAsset]))
    .toArray();
  const stillUsedAssetsIds = uniq(
    usingActivities
      .map(({ operations }) => operations.map(({ fkAsset }) => fkAsset))
      .flat()
      .filter(isDefined)
  );
  const stillUsedAssetsIdsDictionary = Object.fromEntries(stillUsedAssetsIds.map(id => [id, true]));
  const unusedAssetsIds = activityAssetsIdsToRemoveCandidates.filter(id => !stillUsedAssetsIdsDictionary[id]);
  await evmActivityAssets.bulkDelete(unusedAssetsIds);
};
