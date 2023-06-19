import { useSelector } from '../index';

export const useNewsletterEmailsSelector = () => useSelector(({ newsletter }) => newsletter.emails);
export const useShouldShowNewsletterModalSelector = () =>
  useSelector(({ newsletter }) => newsletter.shouldShowNewsletterModal);
