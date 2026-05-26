import { ChangeEvent, useCallback } from 'react';

import { useDispatch } from 'react-redux';
import browser from 'webextension-polyfill';

import { setWebWidgetsTokenInsightEnabledAction } from 'app/store/settings/actions';
import { useWebWidgetsTokenInsightEnabledSelector } from 'app/store/settings/selectors';
import { WEB_WIDGETS_TOKEN_INSIGHT_ENABLED } from 'lib/constants';

export const useWebWidgetsSettings = () => {
  const dispatch = useDispatch();

  const isEnabled = useWebWidgetsTokenInsightEnabledSelector();

  const setEnabled = useCallback(
    (toChecked: boolean, event?: ChangeEvent<HTMLInputElement>) => {
      event?.preventDefault();

      dispatch(setWebWidgetsTokenInsightEnabledAction(toChecked));
      browser.storage.local.set({ [WEB_WIDGETS_TOKEN_INSIGHT_ENABLED]: toChecked });
    },
    [dispatch]
  );

  return { isEnabled, setEnabled };
};
