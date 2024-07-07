import constate from 'constate';

import { useBooleanState } from 'lib/ui/hooks';

export const [ManageAssetsStateProvider, useManageAssetsState] = constate(() => {
  const [manageActive, _, setManageInactive, toggleManageActive] = useBooleanState(false);

  return { manageActive, setManageInactive, toggleManageActive };
});
