import BigNumber from 'bignumber.js';

export type RewardsPerEventHistoryItem = Partial<
  Record<
    'rewardPerOwnBlock' | 'rewardPerEndorsement' | 'rewardPerFutureBlock' | 'rewardPerFutureEndorsement',
    BigNumber
  >
>;

interface RewardsTrueType {
  rewardPerOwnBlock: BigNumber;
  rewardPerEndorsement: BigNumber;
  rewardPerFutureBlock: BigNumber;
  rewardPerFutureEndorsement: BigNumber;
}

export const reduceFunction = (
  fallbackRewardsItem: RewardsTrueType,
  key: keyof RewardsPerEventHistoryItem,
  index: number,
  historyItem: RewardsPerEventHistoryItem,
  rewardsPerEventHistory: RewardsPerEventHistoryItem[]
) => {
  if (historyItem[key]) {
    return {
      ...fallbackRewardsItem,
      [key]: historyItem[key]
    };
  }
  let leftValueIndex = index - 1;
  while (leftValueIndex >= 0 && !rewardsPerEventHistory[leftValueIndex][key]) {
    leftValueIndex--;
  }
  let rightValueIndex = index + 1;
  while (rightValueIndex < rewardsPerEventHistory.length && !rewardsPerEventHistory[rightValueIndex][key]) {
    rightValueIndex++;
  }
  let fallbackRewardsValue = new BigNumber(0);
  const leftValueExists = leftValueIndex >= 0;
  const rightValueExists = rightValueIndex < rewardsPerEventHistory.length;
  if (leftValueExists && rightValueExists) {
    const leftValue = rewardsPerEventHistory[leftValueIndex][key]!;
    const rightValue = rewardsPerEventHistory[rightValueIndex][key]!;
    const x0 = leftValueIndex;
    const y0 = leftValue;
    const x1 = rightValueIndex;
    const y1 = rightValue;
    fallbackRewardsValue = new BigNumber(index - x0)
      .div(x1 - x0)
      .multipliedBy(y1.minus(y0))
      .plus(y0);
  } else if (leftValueExists || rightValueExists) {
    fallbackRewardsValue = rewardsPerEventHistory[leftValueExists ? leftValueIndex : rightValueIndex][key]!;
  }
  return {
    ...fallbackRewardsItem,
    [key]: fallbackRewardsValue
  };
};
