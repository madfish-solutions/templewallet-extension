const DOMAINS_TO_TRACK = [
  'https://etherscan.io/',
  'https://bscscan.com/',
  'https://polygonscan.com/',
  'https://tronscan.org/#/',
  'https://arbiscan.io/',
  'https://www.livecoinwatch.com/',
  'https://www.coindesk.com/',
  'https://u.today/',
  'https://decrypt.co/',
  'https://tzkt.io/'
];

const URLS_TO_TRACK = [
  'https://etherscan.io/tx',
  'https://etherscan.io/address',
  'https://etherscan.io/token',
  'https://bscscan.com/tx',
  'https://bscscan.com/address',
  'https://bscscan.com/token',
  'https://polygonscan.com/tx',
  'https://polygonscan.com/address',
  'https://polygonscan.com/token',
  'https://tronscan.org/#/transaction',
  'https://tronscan.org/#/address',
  'https://tronscan.org/#/block',
  'https://tronscan.org/#/address',
  'https://www.coingecko.com/en/exchanges',
  'https://www.coindesk.com/policy',
  'https://cointelegraph.com/news',
  'https://dappradar.com/rankings/explorer'
];

// https://www.coindesk.com/policy/2023/08/11/sam-bankman-fried-jailed-ahead-of-trial
const coindeskPolicyRegExp = /^https:\/\/www\.coindesk\.com\/policy\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+$/;

// https://de.fi/account/0xd874387ebb001a6b0bea98072f8de05f8965e51e/dashboard/portfolio-overview
const defiAccountRegExp = /^https:\/\/de\.fi\/account\/[a-zA-Z0-9]+\/dashboard\/portfolio-overview$/;

// https://tzkt.io/KT1WT8hZsixALTmxcM3SDzCyh4UF8hYXVaUb/operations/
const tzktTokenOrAccountRegExp = /^https:\/\/tzkt\.io\/[a-zA-Z0-9]+\/operations$/;

// https://tzkt.io/ooSNf4vavf8Eo6UmiBKnSPfLjESqHwbtumh4kzYAFtiAo9XVEY9/69189236
const tzktOpHashRegExp = /https:\/\/tzkt\.io\/([^/]+)/;

const URLS_REG_EXP = [coindeskPolicyRegExp, defiAccountRegExp, tzktTokenOrAccountRegExp, tzktOpHashRegExp];

const checkUrlByRegExp = (activeUrl: string) => URLS_REG_EXP.some(regExp => regExp.test(activeUrl));

const checkCurrentUrlByMatches = (activeUrl: string) =>
  Boolean(URLS_TO_TRACK.some(urlToTrack => activeUrl.includes(urlToTrack)));

export const checkMatchByUrl = (url: string) =>
  DOMAINS_TO_TRACK.includes(url) || checkCurrentUrlByMatches(url) || checkUrlByRegExp(url);
