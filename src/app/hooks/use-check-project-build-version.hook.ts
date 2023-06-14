import { useEffect } from 'react';

import { useDispatch } from 'react-redux';

import packageJson from '../../../package.json';
import { togglePartnersPromotionAction } from '../store/partners-promotion/actions';
import { setAdsBannerVisibilityAction, setLastProjectBuildVersion } from '../store/settings/actions';
import { useLastProjectBuildVersionSelector } from '../store/settings/selectors';

export const useCheckProjectBuildVersion = () => {
  const dispatch = useDispatch();

  const lastBuildVersion = useLastProjectBuildVersionSelector();

  useEffect(() => {
    if (lastBuildVersion !== packageJson.version) {
      dispatch(togglePartnersPromotionAction(false));
      dispatch(setAdsBannerVisibilityAction(true));
      dispatch(setLastProjectBuildVersion(packageJson.version));
    }
  }, [lastBuildVersion, packageJson.version]);
};
