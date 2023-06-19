import { createAction } from '@reduxjs/toolkit';

export const addNewsletterEmailAction = createAction<string>('newsletter/ADD_EMAIL');
export const shouldShowNewsletterModalAction = createAction<boolean>('newsletter/SHOULD_SHOW_NEWSLETTER_MODAL');
