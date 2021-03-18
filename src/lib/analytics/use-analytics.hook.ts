import Analytics from "analytics-node";
import { nanoid } from "nanoid";

import { useLocalStorage } from "lib/temple/front/local-storage";

import { AnalyticsEventCategory } from "./analytics-event.enum";
import { loadChainId } from "../temple/helpers";

interface AnalyticsStateInterface {
  enabled?: boolean,
  userId: string,
}

const client = new Analytics(process.env.TEMPLE_WALLET_SEGMENT_WRITE_KEY ?? '');

export const sendTrackEvent = async (
  userId: string,
  rpc: string,
  event: string,
  category: AnalyticsEventCategory = AnalyticsEventCategory.General,
  properties?: object
) => {
  const chainId = await loadChainId(rpc);

  client.track({
    userId,
    event: `${event}_${category}`,
    properties: {
      ...properties,
      event,
      category,
      chainId,
      timestamp: +new Date()
    },
  });
}

export const useAnalytics = () => {
  const [analyticsState, setAnalyticsState] = useLocalStorage<AnalyticsStateInterface>('analytics', {
    enabled: undefined,
    userId: nanoid()
  });

  return {
    analyticsState,
    setAnalyticsState,
  };
}
