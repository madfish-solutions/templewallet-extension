export interface NewsletterState {
  emails: Array<string>;
  shouldShowNewsletterModal: boolean;
}

export const newsletterInitialState: NewsletterState = {
  emails: [],
  shouldShowNewsletterModal: true
};

export interface NewsletterRootState {
  newsletter: NewsletterState;
}
