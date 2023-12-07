import { TypedUseSelectorHook, useSelector as useRawSelector } from 'react-redux';

import type { RootState } from './root-state.type';

export const useSelector: TypedUseSelectorHook<RootState> = useRawSelector;
