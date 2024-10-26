import React, { memo } from 'react';

import browser from 'webextension-polyfill';

import Flag from 'app/atoms/Flag';
import { CellPartProps } from 'app/templates/select-with-modal';

import { LocaleOption } from './options';

export const LocaleIcon = memo<CellPartProps<LocaleOption>>(({ option: { flagName, code } }) => (
  <Flag alt={code} src={browser.runtime.getURL(`/misc/country-flags/${flagName}.png`)} />
));
