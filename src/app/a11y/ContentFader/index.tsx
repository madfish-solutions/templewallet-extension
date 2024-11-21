import React from 'react';

import clsx from 'clsx';

import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';

import ModStyles from './styles.module.css';

export const ACTIVATE_CONTENT_FADER_CLASSNAME = ModStyles.fadeContent;

export const ContentFader = () => {
  const testnetModeEnabled = useTestnetModeEnabledSelector();

  return (
    <div className={clsx(ModStyles.contentFader, testnetModeEnabled && 'mt-6 !rounded-t-none', 'z-content-fade')} />
  );
};
