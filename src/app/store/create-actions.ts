import { createAction } from '@reduxjs/toolkit';

export const createActions = <CreatePayload = void, SuccessPayload = void, FailPayload = string>(type: string) => ({
  submit: createAction<CreatePayload>(type),
  success: createAction<SuccessPayload>(`${type}-SUCCESS`),
  fail: createAction<FailPayload>(`${type}-FAIL`)
});
