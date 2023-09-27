import {
  coindeskArticlesRegExp,
  EXACT_MATCH_URLS,
  REG_EXPS_WITH_URLS,
  STARTS_WITH_URLS,
  tzktOpHashRegExp,
  tzktTokenOrAccountRegExp
} from './constants';

export const getTrackedUrl = (actualUrl: string) => {
  console.log(actualUrl, 'actual');
  if (EXACT_MATCH_URLS.includes(actualUrl)) {
    return actualUrl;
  }

  if (tzktTokenOrAccountRegExp.test(actualUrl) || tzktOpHashRegExp.test(actualUrl)) {
    return transformTzktUrl(actualUrl);
  }

  if (coindeskArticlesRegExp.test(actualUrl)) {
    const articleCategory = actualUrl.split('/')[3];

    return `https://www.coindesk.com/${articleCategory}/articles`;
  }

  for (let i = 0; i < REG_EXPS_WITH_URLS.length; i++) {
    const currentItem = REG_EXPS_WITH_URLS[i];

    if (currentItem.regExp.test(actualUrl)) {
      return currentItem.url;
    }
  }

  for (let i = 0; i < STARTS_WITH_URLS.length; i++) {
    const currentLink = STARTS_WITH_URLS[i];

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
