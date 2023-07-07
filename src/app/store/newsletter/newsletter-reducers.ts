import { createReducer } from '@reduxjs/toolkit';

import { shouldShowNewsletterModalAction } from './newsletter-actions';
import { NewsletterState, newsletterInitialState } from './newsletter-state';

export const newsletterReducers = createReducer<NewsletterState>(newsletterInitialState, builer => {
  builer.addCase(shouldShowNewsletterModalAction, (_, { payload }) => ({
    shouldShowNewsletterModal: payload
  }));
});
