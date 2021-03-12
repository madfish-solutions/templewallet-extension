import { AnalyticsEventCategory } from "./analytics-event.enum";
import { useAnalytics } from "./use-analytics.hook";

export const useFormAnalytics = (formName: string) => {
  const { trackEvent } = useAnalytics();

  const trackFormSubmit = (properties?: object) => trackEvent(formName, AnalyticsEventCategory.FormSubmit, properties);
  const trackFormSubmitSuccess = (properties?: object) => trackEvent(formName, AnalyticsEventCategory.FormSubmitSuccess, properties);
  const trackFormSubmitFail = (properties?: object) => trackEvent(formName, AnalyticsEventCategory.FormSubmitFail, properties);

  return {
    trackFormSubmit,
    trackFormSubmitSuccess,
    trackFormSubmitFail
  };
}
