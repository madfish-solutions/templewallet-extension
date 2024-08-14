import React from 'react';

import clsx from 'clsx';

import ModStyles from './styles.module.css';

export const ACTIVATE_CONTENT_FADER_CLASSNAME = ModStyles.fadeContent;

export const ContentFader = () => <div className={clsx(ModStyles.contentFader, 'z-content-fade')} />;
