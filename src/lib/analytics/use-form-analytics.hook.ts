import { AnalyticsEventCategory } from "./analytics-event.enum";
import { useAnalytics } from "./use-analytics.hook";

export const useFormAnalytics = (formName: string) => {
  const { trackEvent } = useAnalytics();

  const trackSubmit = (properties?: object) => trackEvent(formName, AnalyticsEventCategory.FormSubmit, properties);
  const trackSubmitSuccess = (properties?: object) => trackEvent(formName, AnalyticsEventCategory.FormSubmitSuccess, properties);
  const trackSubmitFail = (properties?: object) => trackEvent(formName, AnalyticsEventCategory.FormSubmitFail, properties);

  return {
    trackSubmit,
    trackSubmitSuccess,
    trackSubmitFail
  };
}
