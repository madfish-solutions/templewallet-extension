import { HttpResponseError } from '@taquito/http-utils';

import { toastError } from 'app/toaster';

const COUNTER_ERROR_MESSAGES = ['counter_in_the_past', 'counter_in_the_future'];

export const showEstimationError = (err: any) => {
  let displayMessage;

  if (err instanceof HttpResponseError && COUNTER_ERROR_MESSAGES.some(errMessage => err.message.includes(errMessage))) {
    displayMessage = 'Sending too fast, try again in a few seconds.';
  } else {
    displayMessage = 'Failed to estimate transaction.';
  }

  toastError(displayMessage);
};
