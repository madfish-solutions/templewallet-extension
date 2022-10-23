import { HttpResponseError } from '@taquito/http-utils';
import browser from 'webextension-polyfill';

// (!) Only importing from `lib/i18n/${'helpers' | 'types'}` directly here
import {
  asyncGetSavedLocale,
  getNativeLocale,
  getDefaultLocale,
  areLocalesEqual,
  fetchLocaleMessages,
  applySubstitutions
} from 'lib/i18n/helpers';
import type { TID, Substitutions } from 'lib/i18n/types';
import { IntercomError } from 'lib/intercom/helpers';

export async function fetchMessage(msgId: TID, substitutions?: Substitutions) {
  const savedLocale = await asyncGetSavedLocale();
  const nativeLocale = getNativeLocale();

  let result: string | null = null;

  // primary source

  if (!savedLocale || areLocalesEqual(savedLocale, nativeLocale))
    result = browser.i18n.getMessage(msgId, substitutions);
  else {
    result = await fetchAllGetOneLocaleMessageStr(savedLocale, msgId, substitutions);
  }

  if (result) return result;

  // secondary (fallback, default) source

  const defltLocale = getDefaultLocale();

  if (savedLocale) {
    if (areLocalesEqual(defltLocale, savedLocale)) return '';
    if (areLocalesEqual(savedLocale, nativeLocale)) return '';
  } else if (areLocalesEqual(defltLocale, nativeLocale)) return '';

  result = await fetchAllGetOneLocaleMessageStr(defltLocale, msgId, substitutions);

  return result || '';
}

async function fetchAllGetOneLocaleMessageStr(locale: string, msgId: string, substitutions?: Substitutions) {
  const messages = await fetchLocaleMessages(locale);
  const val = messages ? messages[msgId] : null;
  return val ? applySubstitutions(val, substitutions) : null;
}

export async function transformHttpResponseError(err: HttpResponseError) {
  let parsedBody: any;
  try {
    parsedBody = JSON.parse(err.body);
  } catch {
    throw new Error(await fetchMessage('unknownErrorFromRPC', err.url));
  }

  try {
    const firstTezError = parsedBody[0];

    let message: string;

    // Parse special error with Counter Already Used
    if (typeof firstTezError.msg === 'string' && /Counter.*already used for contract/.test(firstTezError.msg)) {
      message = await fetchMessage('counterErrorDescription');
    } else {
      const msgId = getTezErrLocaleMsgId(firstTezError?.id);
      message = msgId ? await fetchMessage(msgId) : err.message;
    }

    return new IntercomError(message, parsedBody);
  } catch {
    throw err;
  }
}

enum KNOWN_TEZ_ERRORS {
  'implicit.empty_implicit_contract' = 'emptyImplicitContract',
  'contract.balance_too_low' = 'balanceTooLow'
}

function getTezErrLocaleMsgId(tezErrId?: string) {
  const idPostfixes = Object.keys(KNOWN_TEZ_ERRORS) as (keyof typeof KNOWN_TEZ_ERRORS)[];
  const matchingPostfix = tezErrId && idPostfixes.find(idPostfix => tezErrId.endsWith(idPostfix));
  return (matchingPostfix && KNOWN_TEZ_ERRORS[matchingPostfix]) || null;
}
