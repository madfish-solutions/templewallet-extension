import { isDefined } from '@rnw-community/shared';
import { Collection } from 'dexie';

import { filterUnique } from 'lib/utils';

import { DbEvmActivity, db, evmActivities, evmActivitiesIntervals, evmActivityAssets } from '../db';

export const deleteEvmActivitiesByAddress = async (account: HexString) =>
  db.transaction('rw!', evmActivities, evmActivitiesIntervals, evmActivityAssets, async () => {
    account = account.toLowerCase() as HexString;
    const intervalIds = await evmActivitiesIntervals.where({ account }).primaryKeys();
    await evmActivitiesIntervals.bulkDelete(intervalIds);
    const activitiesCollection = evmActivities.where({ account });
    await deleteEvmActivities(activitiesCollection);
  });

export const deleteEvmActivities = async (activitiesCollection: Collection<DbEvmActivity, number, DbEvmActivity>) => {
  const activitiesIds = await activitiesCollection.primaryKeys();
  const activities = (await evmActivities.bulkGet(activitiesIds)).filter(isDefined);
  await evmActivities.bulkDelete(activitiesIds);
  const activityAssetsIdsToRemoveCandidates = filterUnique(
    activities
      .map(({ operations }) => operations.map(({ fkAsset }) => fkAsset))
      .flat()
      .filter(isDefined)
  );
  const candidatesDictionary = Object.fromEntries(activityAssetsIdsToRemoveCandidates.map(id => [id, true]));
  const usingActivities = await evmActivities
    .filter(({ operations }) => operations.some(({ fkAsset }) => fkAsset && candidatesDictionary[fkAsset]))
    .toArray();
  const stillUsedAssetsIds = filterUnique(
    usingActivities
      .map(({ operations }) => operations.map(({ fkAsset }) => fkAsset))
      .flat()
      .filter(isDefined)
  );
  const stillUsedAssetsIdsDictionary = Object.fromEntries(stillUsedAssetsIds.map(id => [id, true]));
  const unusedAssetsIds = activityAssetsIdsToRemoveCandidates.filter(id => !stillUsedAssetsIdsDictionary[id]);
  await evmActivityAssets.bulkDelete(unusedAssetsIds);
};
