export interface Detector {
  id: string;
  scan(post: HTMLElement): DetectedRef[];
  resolve(ref: DetectedRef): Promise<TagData | null>;
}

export interface DetectedRef {
  sourceHref: string;
  postEl: HTMLElement;
  statusId?: string;
  linkEl?: HTMLAnchorElement;
}

export interface TagData {
  iconUrl: string;
  label: string;
  href?: string;
  raw?: unknown;
}
