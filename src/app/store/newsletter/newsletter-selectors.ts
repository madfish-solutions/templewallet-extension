import { useSelector } from '../index';

export const useShouldShowNewsletterModalSelector = () =>
  useSelector(({ newsletter }) => newsletter.shouldShowNewsletterModal);
