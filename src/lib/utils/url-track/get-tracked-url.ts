import {
  coindeskArticlesRegExp,
  EXACT_MATCH_URLS,
  REG_EXPS_WITH_TRUNCATED_URLS,
  TRUNCATED_URLS,
  tzktOpHashRegExp,
  tzktTokenOrAccountRegExp
} from './constants';

export const getTrackedUrl = (actualUrl: string) => {
  if (EXACT_MATCH_URLS.includes(actualUrl)) {
    return actualUrl;
  }

  if (tzktTokenOrAccountRegExp.test(actualUrl) || tzktOpHashRegExp.test(actualUrl)) {
    return transformTzktUrl(actualUrl);
  }

  if (coindeskArticlesRegExp.test(actualUrl)) {
    return `https://www.coindesk.com/${actualUrl.split('/')[3]}/articles`;
  }

  for (let i = 0; i < REG_EXPS_WITH_TRUNCATED_URLS.length; i++) {
    const currentItem = REG_EXPS_WITH_TRUNCATED_URLS[i];

    if (currentItem.regExp.test(actualUrl)) {
      return currentItem.url;
    }
  }

  for (let i = 0; i < TRUNCATED_URLS.length; i++) {
    const currentLink = TRUNCATED_URLS[i];

    if (actualUrl.startsWith(currentLink)) {
      return currentLink;
    }
  }

  return null;
};

const transformTzktUrl = (url: string) => {
  const splittedUrl = url.split('/');
  const indexOfParamToCheck = 3;
  const checkedParam = splittedUrl[indexOfParamToCheck];

  if (checkedParam.startsWith('tz')) {
    return `https://tzkt.io/address/`;
  } else if (checkedParam.startsWith('KT')) {
    return `https://tzkt.io/token/`;
  } else if (checkedParam.startsWith('o')) {
    return `https://tzkt.io/transaction/`;
  }

  return 'https://tzkt.io/';
};
