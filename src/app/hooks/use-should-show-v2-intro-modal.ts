import { useEffect } from 'react';

import { isDefined } from '@rnw-community/shared';

import { SHOULD_SHOW_V2_INTRO_MODAL_STORAGE_KEY } from 'lib/constants';
import { APP_VERSION } from 'lib/env';
import { useStorage } from 'lib/temple/front';

export const useShouldShowV2IntroModal = (value: boolean) => {
  const [shouldShowV2IntroModal, setShouldShowV2IntroModal] = useStorage(SHOULD_SHOW_V2_INTRO_MODAL_STORAGE_KEY);

  useEffect(() => {
    if (!isDefined(shouldShowV2IntroModal) && Number(APP_VERSION.slice(0, 1)) >= 2) {
      setShouldShowV2IntroModal(value);
    }
  }, [value, shouldShowV2IntroModal, setShouldShowV2IntroModal]);
};
