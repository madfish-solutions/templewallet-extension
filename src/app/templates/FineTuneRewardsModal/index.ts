import { use } from 'react';

const importFineTuneRewardsModalModule = async () => {
  try {
    return await import(
      // An error appears below if and only the imported file is removed
      // oxlint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore
      // oxlint-disable-next-line import/no-unresolved
      'app/templates/FineTuneRewardsModal/component'
    );
  } catch {
    return null;
  }
};

const importPromise = importFineTuneRewardsModalModule();

export const useFineTuneRewardsModalModule = () => use(importPromise);
