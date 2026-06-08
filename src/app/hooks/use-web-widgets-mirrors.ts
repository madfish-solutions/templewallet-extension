import { useEffect } from 'react';

import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { useAnalyticsEnabledSelector } from 'app/store/settings/selectors';
import { ANALYTICS_ENABLED_MIRROR, SHOULD_SHOW_PROMOTION_MIRROR } from 'lib/constants';
import { usePassiveStorage } from 'lib/temple/front/storage';

const useStorageMirror = (key: string, value: boolean) => {
  const [stored, setStored] = usePassiveStorage<boolean>(key);

  useEffect(() => {
    if (stored !== value) setStored(value);
  }, [value, stored, setStored]);
};

export const useWebWidgetsMirrors = () => {
  useStorageMirror(SHOULD_SHOW_PROMOTION_MIRROR, useShouldShowPartnersPromoSelector());
  useStorageMirror(ANALYTICS_ENABLED_MIRROR, useAnalyticsEnabledSelector());
};
