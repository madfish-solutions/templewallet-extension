import Analytics from "analytics-node";
import { nanoid } from "nanoid";

import { useLocalStorage } from "lib/temple/front/local-storage";

import { loadChainId } from "../temple/helpers";
import { AnalyticsEventCategory } from "./analytics-event.enum";

if (!process.env.TEMPLE_WALLET_SEGMENT_WRITE_KEY) {
  throw new Error(
    "Require a 'TEMPLE_WALLET_SEGMENT_WRITE_KEY' environment variable to be set"
  );
}

const client = new Analytics(process.env.TEMPLE_WALLET_SEGMENT_WRITE_KEY);

interface AnalyticsStateInterface {
  enabled?: boolean;
  userId: string;
}

export const sendTrackEvent = async (
  userId: string,
  rpc: string | undefined,
  event: string,
  category: AnalyticsEventCategory = AnalyticsEventCategory.General,
  properties?: object
) => {
  const chainId = rpc && (await loadChainId(rpc));

  client.track({
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
};

export const sendPageEvent = async (
  userId: string,
  rpc: string | undefined,
  path: string,
  search: string,
  tokenAddress?: string,
  tokenId?: string
) => {
  const url = `${path}${search}`;
  const chainId = rpc && (await loadChainId(rpc));

  client.page({
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
      ...(tokenAddress !== undefined && { tokenAddress }),
      ...(tokenId !== undefined && { tokenId })
    },
  });
};

export const useAnalyticsState = () => {
  const [
    analyticsState,
    setAnalyticsState,
  ] = useLocalStorage<AnalyticsStateInterface>("analytics", {
    enabled: undefined,
    userId: nanoid(),
  });

  return {
    analyticsState,
    setAnalyticsState,
  };
};
