import { use } from 'react';

const importLoadHypelabScriptModule = async () => {
  try {
    return await import('app/load-hypelab-script/component');
  } catch {
    return null;
  }
};

const importPromise = importLoadHypelabScriptModule();

export const useLoadHypelabScriptModule = () => use(importPromise);
