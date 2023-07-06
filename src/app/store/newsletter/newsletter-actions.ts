import { createAction } from '@reduxjs/toolkit';

export const shouldShowNewsletterModalAction = createAction<boolean>('newsletter/SHOULD_SHOW_NEWSLETTER_MODAL');
