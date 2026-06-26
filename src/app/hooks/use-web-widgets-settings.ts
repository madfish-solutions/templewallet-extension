import { ChangeEvent } from 'react';

import browser from 'webextension-polyfill';

import { dispatch } from 'app/store';
import { setWebWidgetsTokenInsightEnabledAction } from 'app/store/settings/actions';
import { useWebWidgetsTokenInsightEnabledSelector } from 'app/store/settings/selectors';
import {
  WEB_WIDGETS_LOCAL_AD_PERMIT,
  WEB_WIDGETS_SNOOZE_UNTIL,
  WEB_WIDGETS_TOKEN_INSIGHT_ENABLED
} from 'lib/constants';

export const useWebWidgetsSettings = () => {
  const isEnabled = useWebWidgetsTokenInsightEnabledSelector();

  const setEnabled = (toChecked: boolean, event?: ChangeEvent<HTMLInputElement>) => {
    event?.preventDefault();

    dispatch(setWebWidgetsTokenInsightEnabledAction(toChecked));
    browser.storage.local.set({
      [WEB_WIDGETS_TOKEN_INSIGHT_ENABLED]: toChecked,
      [WEB_WIDGETS_SNOOZE_UNTIL]: 0,
      [WEB_WIDGETS_LOCAL_AD_PERMIT]: false
    });
  };

  return { isEnabled, setEnabled };
};
