import { omit } from 'lodash';

import { db } from './db';

export const resetDb = async () => {
  await db.delete();
  await db.open();
};

export const omitId = <T extends { id?: number }>(obj: T) => omit(obj, 'id');
