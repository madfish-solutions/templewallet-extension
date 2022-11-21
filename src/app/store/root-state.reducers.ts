import { combineReducers } from '@reduxjs/toolkit';
import { Action, AnyAction, Reducer, ReducersMapObject } from 'redux';
import { reducer } from 'ts-action';

export const rootStateReducer =
  <S extends object, A extends Action = AnyAction>(reducers: ReducersMapObject<S, A>): Reducer<S, A> =>
  (appState, action) => {
    const rootReducer = reducer(appState);

    const state = rootReducer(appState, action);

    return combineReducers(reducers)(state, action);
  };
