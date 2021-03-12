import { AnalyticsEventCategory } from "./analytics-event.enum";
import { useAnalyticsTrackEvent } from "./use-analytics-track-event.hook";

export const useFormAnalytics = (formName: string) => {
  const trackEvent = useAnalyticsTrackEvent();

  const trackSubmit = (properties?: object) => trackEvent(formName, AnalyticsEventCategory.FormSubmit, properties);
  const trackSubmitSuccess = (properties?: object) => trackEvent(formName, AnalyticsEventCategory.FormSubmitSuccess, properties);
  const trackSubmitFail = (properties?: object) => trackEvent(formName, AnalyticsEventCategory.FormSubmitFail, properties);

  return {
    trackSubmit,
    trackSubmitSuccess,
    trackSubmitFail
  };
}
