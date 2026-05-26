import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';
import type { ObjktToken } from 'lib/temple/back/web-widgets/objkt-query';

export const resolveTco = (tcoUrl: string): Promise<string | null> =>
  browser.runtime.sendMessage({
    type: ContentScriptType.ResolveTco,
    tcoUrl
  });

export const fetchObjktToken = (params: { contract: string; tokenId: string }): Promise<ObjktToken | null> =>
  browser.runtime.sendMessage({
    type: ContentScriptType.FetchObjktToken,
    contract: params.contract,
    tokenId: params.tokenId
  });

export const fetchThumbnailBlob = (url: string): Promise<string | null> =>
  browser.runtime.sendMessage({
    type: ContentScriptType.FetchThumbnailBlob,
    url
  });
