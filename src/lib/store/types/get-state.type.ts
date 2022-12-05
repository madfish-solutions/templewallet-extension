import { Reducer } from 'redux';

export type GetStateType<R> = R extends Reducer<infer S> ? S : never;
