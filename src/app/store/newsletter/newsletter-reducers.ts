import { createReducer } from '@reduxjs/toolkit';

import { addNewsletterEmailAction, shouldShowNewsletterModalAction } from './newsletter-actions';
import { NewsletterState, newsletterInitialState } from './newsletter-state';

export const newsletterReducers = createReducer<NewsletterState>(newsletterInitialState, builer => {
  builer.addCase(addNewsletterEmailAction, (state, { payload }) => ({
    shouldShowNewsletterModal: false,
    emails: [...state.emails, payload]
  }));
  builer.addCase(shouldShowNewsletterModalAction, (state, { payload }) => ({
    ...state,
    shouldShowNewsletterModal: payload
  }));
});
