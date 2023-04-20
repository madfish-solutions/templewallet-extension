import { ABTestGroup } from 'lib/apis/temple';
import { createActions } from 'lib/store';

export const getUserTestingGroupNameActions = createActions<void, ABTestGroup, string>(
  'abtesting/GET_USER_TESTING_GROUP_NAME'
);
