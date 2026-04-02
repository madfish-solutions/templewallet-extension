import { useEffect } from 'react';

import { dispatch } from 'app/store';
import { getUserTestingGroupNameActions } from 'app/store/ab-testing/actions';

export const useABTestingLoading = () => {
  useEffect(() => void dispatch(getUserTestingGroupNameActions.submit()), []);
};
