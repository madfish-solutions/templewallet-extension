import { IS_CORE_BUILD } from './env';
import { PATHS, PATH_HYPELAB_EMBED_FILE_EXISTS } from './paths';

/** From lodash */
type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T;

export const isTruthy = <T>(value: T): value is Truthy<T> => Boolean(value);

export const shouldDisableAds = IS_CORE_BUILD || !PATH_HYPELAB_EMBED_FILE_EXISTS;

export const IFRAMES: Record<string, string> = shouldDisableAds ? {} : { 'ads-stack': PATHS.ADS_STACK_IFRAME };
