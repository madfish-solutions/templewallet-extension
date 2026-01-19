import { use } from 'react';

const importLoadHypelabScriptModule = async () => {
  try {
    // An error appears below if and only the imported file is removed
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore
    // eslint-disable-next-line import/no-unresolved
    return await import('app/load-hypelab-script/component');
  } catch {
    return null;
  }
};

const importPromise = importLoadHypelabScriptModule();

export const useLoadHypelabScriptModule = () => use(importPromise);
