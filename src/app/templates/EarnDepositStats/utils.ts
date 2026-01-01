export const toMsTimestamp = (isoTimestamp: string) => new Date(isoTimestamp).getTime();

export const mergeDepositSeries = (tezosSeries?: number[][], ethSeries?: number[][]) => {
  if (!tezosSeries?.length && !ethSeries?.length) return;
  if (!ethSeries?.length) return tezosSeries;
  if (!tezosSeries?.length) return ethSeries;

  const [tezosStartTimestamp] = tezosSeries[0];
  const [ethStartTimestamp] = ethSeries[0];

  const base = tezosStartTimestamp >= ethStartTimestamp ? tezosSeries : ethSeries;
  const other = tezosStartTimestamp >= ethStartTimestamp ? ethSeries : tezosSeries;

  const result: number[][] = [];

  let otherIndex = 0;
  let lastOtherValue = 0;

  for (const [timestamp, baseValue] of base) {
    while (otherIndex < other.length && other[otherIndex][0] <= timestamp) {
      lastOtherValue = other[otherIndex][1];
      otherIndex++;
    }

    result.push([timestamp, baseValue + lastOtherValue]);
  }

  return result;
};
