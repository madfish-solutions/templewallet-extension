import { TypedUseSelectorHook, useSelector as useRawSelector } from 'react-redux';

import { advertisingEpics } from './advertising/epics';
import { RootState, createStore } from './create-store';
import { currencyEpics } from './currency/epics';

export const { store, persistor } = createStore(currencyEpics, advertisingEpics);

export const useSelector: TypedUseSelectorHook<RootState> = useRawSelector;
