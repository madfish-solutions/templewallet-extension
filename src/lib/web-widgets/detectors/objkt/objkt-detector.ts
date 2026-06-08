import type { DetectedRef, Detector, TagData } from '../../engine/types';
import * as messaging from '../../messaging';
import { CANDIDATE_LINK, DIRECT_OBJKT_LINK, parseStatusId } from '../../x-dom/selectors';

import { mapTokenToTagData } from './map-token-to-tagdata';
import { parseObjktUrl } from './parse-objkt-url';

const DETECTOR_ID = 'objkt-nft';

const visibleText = (el: Element): string => (el.textContent ?? '').replace(/\s+/g, '');

const pointsAtObjkt = (text: string): boolean => /^(?:https?:\/\/)?(?:www\.)?objkt\.com\//i.test(text);

export const objktDetector: Detector = {
  id: DETECTOR_ID,

  scan(post: HTMLElement): DetectedRef[] {
    const statusId = parseStatusId(post);
    const refs: DetectedRef[] = [];

    // t.co short links
    for (const anchor of post.querySelectorAll<HTMLAnchorElement>(CANDIDATE_LINK)) {
      if (!pointsAtObjkt(visibleText(anchor))) continue;
      const href = anchor.getAttribute('href');
      if (!href) continue;
      refs.push({ sourceHref: href, postEl: post, statusId, linkEl: anchor });
    }

    // Direct objkt links
    for (const anchor of post.querySelectorAll<HTMLAnchorElement>(DIRECT_OBJKT_LINK)) {
      const href = anchor.getAttribute('href');
      if (!href) continue;
      refs.push({ sourceHref: href, postEl: post, statusId, linkEl: anchor });
    }

    return refs;
  },

  async resolve(ref: DetectedRef): Promise<TagData | null> {
    const isDirect = ref.sourceHref.startsWith('https://objkt.com/');

    const objktUrl = isDirect ? ref.sourceHref : await messaging.resolveTco(ref.sourceHref);
    if (!objktUrl) return null;

    const parsed = parseObjktUrl(objktUrl);
    if (!parsed) return null;

    const token = await messaging.fetchObjktToken(parsed.contract, parsed.tokenId);
    if (!token) return null;

    const tagData = mapTokenToTagData(token, parsed);
    if (!tagData) return null;

    // the background fetches the thumbnail bytes and returns a base64 `data:` URL
    // that x.com's `img-src` CSP cannot block
    if (tagData.iconUrl) {
      const dataUrl = await messaging.fetchThumbnailBlob(tagData.iconUrl);
      if (dataUrl) tagData.iconUrl = dataUrl;
    }

    return tagData;
  }
};
