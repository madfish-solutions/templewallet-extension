import { Collection } from 'dexie';

import { DbTezosActivity, db, tezosActivities, tezosActivitiesIntervals } from '../db';

export const deleteTezosActivitiesByAddress = async (account: string) =>
  db.transaction('rw!', tezosActivities, tezosActivitiesIntervals, async () => {
    const intervalIds = await tezosActivitiesIntervals.where({ account }).primaryKeys();
    await tezosActivitiesIntervals.bulkDelete(intervalIds);
    const activitiesCollection = tezosActivities.where({ account });
    await deleteTezosActivities(activitiesCollection);
  });

export const deleteTezosActivities = async (
  activitiesCollection: Collection<DbTezosActivity, number, DbTezosActivity>
) => {
  const activitiesIds = await activitiesCollection.primaryKeys();
  await tezosActivities.bulkDelete(activitiesIds);
};
