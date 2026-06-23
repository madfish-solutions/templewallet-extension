export interface Detector {
  id: string;
  scan(post: HTMLElement): DetectedRef[];
  resolve(ref: DetectedRef): Promise<TagData | null>;
}

interface DetectedRefBase {
  postEl: HTMLElement;
  statusId?: string;
}

export interface ObjktRef extends DetectedRefBase {
  kind: 'objkt';
  sourceHref: string;
  linkEl?: HTMLAnchorElement;
}

export interface TickerRef extends DetectedRefBase {
  kind: 'ticker';
  symbol: string;
  format: '$' | '#';
}

export type DetectedRef = ObjktRef | TickerRef;

export interface TagData {
  kind: 'objkt' | 'ticker';
  iconUrl: string;
  label: string;
  href?: string;
  raw?: unknown;
}
