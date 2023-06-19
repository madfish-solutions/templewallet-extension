export interface NewsletterState {
  shouldShowNewsletterModal: boolean;
}

export const newsletterInitialState: NewsletterState = {
  shouldShowNewsletterModal: true
};

export interface NewsletterRootState {
  newsletter: NewsletterState;
}
