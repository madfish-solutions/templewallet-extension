import constate from 'constate';

import { useBooleanState } from 'lib/ui/hooks';

export const [AssetsFilterOptionsStateProvider, useAssetsFilterOptionsState] = constate(() => {
  const [filtersOpened, _, setFiltersClosed, toggleFiltersOpened] = useBooleanState(false);

  return { filtersOpened, setFiltersClosed, toggleFiltersOpened };
});
