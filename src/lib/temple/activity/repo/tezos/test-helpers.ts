import { DbTezosActivity, TezosActivitiesInterval, tezosActivities, tezosActivitiesIntervals } from '../db';
import { omitId } from '../test-helpers';

export const checkTezosDbState = async (
  expectedIntervals: TezosActivitiesInterval[],
  expectedActivities: DbTezosActivity[]
) => {
  const actualIntervals = (await tezosActivitiesIntervals.toArray()).map(omitId);
  expect(actualIntervals).toEqual(expectedIntervals.map(omitId));
  const actualDbActivities = (await tezosActivities.toArray()).map(omitId);
  expect(actualDbActivities).toEqual(expectedActivities.map(omitId));
};

export const testAccountPkh = 'tz1XQzfabXm4LZNKnok6W41rdp35qYbti9uE';
export const tkeySlug = 'KT1VaEsVNiBoA56eToEK6n6BcPgh1tdx9eXi_0';
export const testAccount2Pkh = 'tz1L7QjtFG4KJBMZ8tppwMmTjMGwqxPFCSXM';
