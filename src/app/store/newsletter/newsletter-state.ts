export interface NewsletterState {
  shouldShowNewsletterModal: boolean;
}

export const newsletterInitialState: NewsletterState = {
  shouldShowNewsletterModal: false
};

export interface NewsletterRootState {
  newsletter: NewsletterState;
}
