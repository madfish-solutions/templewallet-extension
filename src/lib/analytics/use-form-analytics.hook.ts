import { useMemo } from "react";

import { AnalyticsEventCategory } from "./analytics-event.enum";
import { useAnalytics } from "./use-analytics.hook";

export const useFormAnalytics = (formName: string) => {
  const { trackEvent } = useAnalytics();

  return useMemo(
    () => ({
      trackSubmit: (properties?: object) =>
        trackEvent(formName, AnalyticsEventCategory.FormSubmit, properties),
      trackSubmitSuccess: (properties?: object) =>
        trackEvent(
          formName,
          AnalyticsEventCategory.FormSubmitSuccess,
          properties
        ),
      trackSubmitFail: (properties?: object) =>
        trackEvent(formName, AnalyticsEventCategory.FormSubmitFail, properties),
    }),
    [formName, trackEvent]
  );
};
