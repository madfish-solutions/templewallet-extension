import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';
import type { CoinsBySymbol } from 'lib/temple/back/web-widgets/fetch-coins-by-symbol';
import type { ChartPoint } from 'lib/temple/back/web-widgets/fetch-token-market';
import type { ObjktToken } from 'lib/temple/back/web-widgets/objkt-query';

export const resolveTco = (tcoUrl: string): Promise<string | null> =>
  browser.runtime.sendMessage({
    type: ContentScriptType.ResolveTco,
    tcoUrl
  });

export const fetchObjktToken = (fa: string, tokenId: string): Promise<ObjktToken | null> =>
  browser.runtime.sendMessage({
    type: ContentScriptType.FetchObjktToken,
    fa,
    tokenId
  });

export const fetchThumbnailBlob = (url: string): Promise<string | null> =>
  browser.runtime.sendMessage({
    type: ContentScriptType.FetchThumbnailBlob,
    url
  });

export const getCoinsBySymbol = (): Promise<CoinsBySymbol> =>
  browser.runtime.sendMessage({
    type: ContentScriptType.GetCoinsBySymbol
  });

export const fetchTokenChart = (coinId: string): Promise<ChartPoint[]> =>
  browser.runtime.sendMessage({
    type: ContentScriptType.FetchTokenChart,
    coinId
  });

interface WidgetContextData {
  permitGranted: boolean;
  snoozeUntil: number | null;
  shouldShowPromotion: boolean;
  analyticsEnabled: boolean;
  tezFiatRate: number | null;
  adUrl: string | null;
}

export const getWidgetContext = (): Promise<WidgetContextData> =>
  browser.runtime.sendMessage({
    type: ContentScriptType.WidgetContext
  });

export const getWidgetOwnedCount = (contract: string, tokenId: string): Promise<number> =>
  browser.runtime.sendMessage({
    type: ContentScriptType.WidgetOwnedCount,
    contract,
    tokenId
  });

export const postWidgetAdImpression = (provider: string): Promise<void> =>
  browser.runtime.sendMessage({
    type: ContentScriptType.WebWidgetAdImpression,
    provider
  });

export const trackWebWidgetEvent = (event: string, properties?: object): Promise<void> =>
  browser.runtime.sendMessage({
    type: ContentScriptType.WebWidgetTrackEvent,
    event,
    properties
  });

export const snoozeWebWidgets = (): Promise<void> =>
  browser.runtime.sendMessage({ type: ContentScriptType.WebWidgetSnooze });

export const disableWebWidgets = (): Promise<void> =>
  browser.runtime.sendMessage({ type: ContentScriptType.WebWidgetDisable });
