import { isDefined } from '@rnw-community/shared';

import { calculateStringSizeInBytes } from 'lib/utils/string';

export const getLocalStorageUsageDetails = () => {
  const recordsNumber = localStorage.length;
  const keys = new Array(recordsNumber).fill(null).map((_, i) => localStorage.key(i));

  const keysTotalChars = keys.reduce((acc, key) => acc + (key?.length ?? 0), 0);

  const valuesTotalChars = keys.reduce((acc, key) => {
    const value = isDefined(key) ? localStorage.getItem(key) : null;
    return acc + (value?.length ?? 0);
  }, 0);

  return {
    recordsNumber,
    keysTotalChars,
    valuesTotalChars
  };
};

/** See:
 * - https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#web_storage
 * - http://dev-test.nemikor.com/web-storage/support-test/
 */
const MAX_ENTRY_SIZE = 5 * 1024 * 1024;
/**
 * String.length in JS is a number of characters (code units) in UTF-16 encoding
 * When encoded in UTF-8, each is represented no-more than by 4 bytes
 */
const ROUGH_MAX_ENTRY_SIZE = Math.floor(MAX_ENTRY_SIZE / 4);

export const checkSizeOfLocalStorageEntryToSet = (key: string, value: any) => {
  const stringified = `${key}:${JSON.stringify(value)}`;

  return stringified.length < ROUGH_MAX_ENTRY_SIZE || calculateStringSizeInBytes(stringified) < MAX_ENTRY_SIZE;
};
