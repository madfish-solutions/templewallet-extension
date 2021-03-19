import Analytics from "analytics-node";
import { nanoid } from "nanoid";

import { useLocalStorage } from "lib/temple/front/local-storage";

import { loadChainId } from "../temple/helpers";
import { AnalyticsEventCategory } from "./analytics-event.enum";

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

  process.env.NODE_ENV === "production" && client.track({
    userId,
    event: `${category} ${event}`,
    timestamp: new Date(),
    properties: {
      ...properties,
      event,
      category,
      chainId,
    },
  });
}

export const sendPageEvent = async (
  userId: string,
  rpc: string,
  path: string,
  search: string
) => {
  const url = `${path}${search}`;
  const chainId = await loadChainId(rpc);

  process.env.NODE_ENV === "production" && client.page({
    userId,
    name: url,
    timestamp: new Date(),
    category: AnalyticsEventCategory.PageOpened,
    properties: {
      url,
      path: search,
      referrer: path,
      category: AnalyticsEventCategory.PageOpened,
      chainId,
    },
  });
};

export const useAnalyticsState = () => {
  const [analyticsState, setAnalyticsState] = useLocalStorage<AnalyticsStateInterface>('analytics', {
    enabled: undefined,
    userId: nanoid()
  });

  return {
    analyticsState,
    setAnalyticsState,
  };
}
