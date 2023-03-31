import { createActions } from 'lib/store';

import { ABTestGroup } from '../../../lib/apis/temple';

export const getUserTestingGroupName = createActions<void, ABTestGroup, string>(
  'abtesting/GET_USER_TESTING_GROUP_NAME'
);
