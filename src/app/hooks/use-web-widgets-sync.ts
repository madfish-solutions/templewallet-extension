import { useEffect } from 'react';

import { dispatch } from 'app/store';
import { setWebWidgetsTokenInsightEnabledAction } from 'app/store/settings/actions';
import { WEB_WIDGETS_TOKEN_INSIGHT_ENABLED } from 'lib/constants';
import { onStorageKey } from 'lib/web-widgets/storage';

export const useWebWidgetsSync = () => {
  useEffect(
    () =>
      onStorageKey<boolean>(WEB_WIDGETS_TOKEN_INSIGHT_ENABLED, value => {
        if (typeof value === 'boolean') dispatch(setWebWidgetsTokenInsightEnabledAction(value));
      }),
    []
  );
};
