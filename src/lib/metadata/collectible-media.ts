const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm4v', 'ogv']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'oga', 'flac', 'm4a', 'aac', 'aiff', 'aif']);
const MODEL_EXTENSIONS = new Set(['glb', 'gltf', 'usdz']);
const HTML_EXTENSIONS = new Set(['html', 'htm']);

const SEADN_HOSTS = new Set(['i.seadn.io', 'i2.seadn.io', 'i2c.seadn.io', 'raw.seadn.io', 'raw2.seadn.io']);
const OPENSEA_CDN_HOSTS = new Set(['i2.seadn.io', 'i2c.seadn.io', 'raw.seadn.io', 'raw2.seadn.io']);

export type CollectibleMediaKind = 'video' | 'audio' | 'model' | 'html';

const mediaExtension = (url: string) => {
  let pathname: string;

  try {
    pathname = new URL(url).pathname;
  } catch {
    return undefined;
  }

  const dot = pathname.lastIndexOf('.');
  if (dot < 0 || dot === pathname.length - 1) return undefined;

  return pathname.slice(dot + 1).toLowerCase();
};

const mediaKindFromExtension = (extension: string | undefined): CollectibleMediaKind | undefined => {
  if (!extension) return undefined;
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  if (AUDIO_EXTENSIONS.has(extension)) return 'audio';
  if (MODEL_EXTENSIONS.has(extension)) return 'model';
  if (HTML_EXTENSIONS.has(extension)) return 'html';

  return undefined;
};

const isFrameThumbnail = (url: string) => {
  try {
    return new URL(url).searchParams.has('frame-time');
  } catch {
    return false;
  }
};

/** Video, audio, 3D, or HTML. A seadn `frame-time` URL is a still image. */
const collectibleMediaKind = (url: string): CollectibleMediaKind | undefined => {
  if (isFrameThumbnail(url)) return undefined;

  return mediaKindFromExtension(mediaExtension(url));
};

/** Kind stored by Tezos indexers as a mime type, such as `video/mp4` or `model/gltf-binary`. */
export const collectibleMediaKindFromMime = (mime: string | null | undefined): CollectibleMediaKind | undefined => {
  if (!mime) return undefined;

  const normalized = mime.toLowerCase();
  if (normalized.startsWith('model')) return 'model';
  if (normalized.startsWith('video')) return 'video';
  if (normalized.startsWith('audio')) return 'audio';
  if (normalized.startsWith('text/html') || normalized.startsWith('application/xhtml')) return 'html';

  return undefined;
};

/**
 * Kind the detail page can play.
 * USDZ is an iOS AR package, so the page keeps the still image.
 */
export const collectiblePageMediaKind = (url: string | undefined): CollectibleMediaKind | undefined => {
  if (!url) return undefined;

  const kind = collectibleMediaKind(url);
  if (kind === 'model' && mediaExtension(url) === 'usdz') return undefined;

  return kind;
};

const parseHttpUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return undefined;

    return parsed;
  } catch {
    return undefined;
  }
};

/**
 * Still frame for a video on OpenSea's CDN.
 * `raw2.seadn.io/.../file.mp4` becomes `i2.seadn.io/.../file.mp4?frame-time=1&w=500`.
 * Audio, 3D, and HTML have no CDN thumbnail.
 */
export const seadnVideoFrameUrl = (url: string): string | undefined => {
  const parsed = parseHttpUrl(url);
  if (!parsed || !SEADN_HOSTS.has(parsed.hostname)) return undefined;
  if (mediaKindFromExtension(mediaExtension(url)) !== 'video') return undefined;
  if (parsed.searchParams.has('frame-time')) return url;

  parsed.hostname = 'i2.seadn.io';
  parsed.search = 'frame-time=1&w=500';

  return parsed.toString();
};

/** The video file behind a seadn URL, including one that is already a frame thumbnail. */
const seadnVideoArtifactUrl = (url: string): string | undefined => {
  const parsed = parseHttpUrl(url);
  if (!parsed || !SEADN_HOSTS.has(parsed.hostname)) return undefined;
  if (mediaKindFromExtension(mediaExtension(url)) !== 'video') return undefined;

  parsed.hostname = 'raw2.seadn.io';
  parsed.search = '';

  return parsed.toString();
};

/** URL an `<img>` can load. Non-image media is omitted unless a seadn video frame exists. */
export const collectibleImagePreviewUrl = (url: string): string | undefined => {
  const frame = seadnVideoFrameUrl(url);
  if (frame) return frame;
  if (collectibleMediaKind(url)) return undefined;

  return url;
};

/**
 * Still previews from a set of image fields.
 * An extensionless URL is dropped when another field in the set is audio, video, a model, or HTML.
 * OpenSea stores that file again as `original_image_url` without an extension, and it is not a cover.
 */
export const collectibleStillPreviews = (urls: Array<string | null | undefined>) => {
  const filled = urls.filter((url): url is string => Boolean(url));
  const siblingIsPlayableFile = filled.some(url => Boolean(collectibleMediaKind(url)));
  const previews: string[] = [];

  for (const url of filled) {
    const preview = collectibleImagePreviewUrl(url);
    if (!preview) continue;
    if (siblingIsPlayableFile && !mediaExtension(preview)) continue;

    previews.push(preview);
  }

  return previews;
};

export const firstCollectibleArtifactUrl = (...urls: Array<string | null | undefined>): string | undefined => {
  for (const url of urls) {
    if (!url) continue;
    if (collectibleMediaKind(url)) return url;

    const artifact = seadnVideoArtifactUrl(url);
    if (artifact && isFrameThumbnail(url)) return artifact;
  }

  return undefined;
};

/** True when the preview is already served by OpenSea's CDN, so a failed load should not request OpenSea again. */
export const previewUrlIsOpenseaHosted = (url: string | undefined) => {
  if (!url) return false;

  const parsed = parseHttpUrl(url);
  if (!parsed) return false;

  return OPENSEA_CDN_HOSTS.has(parsed.hostname);
};
