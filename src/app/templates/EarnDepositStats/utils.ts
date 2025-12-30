export const toMsTimestamp = (isoTimestamp: string) => new Date(isoTimestamp).getTime();

export const mergeDepositSeries = (tezosSeries?: number[][], ethSeries?: number[][]) => {
  if (!tezosSeries?.length && !ethSeries?.length) {
    return;
  }

  if (!ethSeries?.length) {
    return tezosSeries;
  }

  if (!tezosSeries?.length) {
    return ethSeries;
  }

  const result: number[][] = [];

  let tIndex = 0;
  let eIndex = 0;
  let lastTezosValue = 0;
  let lastEthValue = 0;

  while (tIndex < tezosSeries.length || eIndex < ethSeries.length) {
    const nextTezos = tIndex < tezosSeries.length ? tezosSeries[tIndex] : null;
    const nextEth = eIndex < ethSeries.length ? ethSeries[eIndex] : null;

    const nextTimestamp = Math.min(
      nextTezos ? nextTezos[0] : Number.POSITIVE_INFINITY,
      nextEth ? nextEth[0] : Number.POSITIVE_INFINITY
    );

    if (nextTezos && nextTezos[0] === nextTimestamp) {
      lastTezosValue = nextTezos[1];
      tIndex++;
    }

    if (nextEth && nextEth[0] === nextTimestamp) {
      lastEthValue = nextEth[1];
      eIndex++;
    }

    result.push([nextTimestamp, lastTezosValue + lastEthValue]);
  }

  return result;
};
