import { useEffect, useState } from 'react';

import browser from 'webextension-polyfill';

export const useCurrentOs = () => {
  const [currentOs, setCurrentOs] = useState('');

  const getCurrentOs = async () => {
    const { os } = await browser.runtime.getPlatformInfo();
    setCurrentOs(os);
  };

  useEffect(() => {
    getCurrentOs();
  }, []);

  return currentOs;
};
