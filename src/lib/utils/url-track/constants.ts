interface RegExpsWithUrls {
  regExp: RegExp;
  url: string;
}

export const REG_EXPS_WITH_URLS: RegExpsWithUrls[] = [
  {
    // https://www.coindesk.com/price/bitcoin/
    regExp: /^https:\/\/www\.coindesk\.com\/price\/[a-z-]+\/$/,
    url: 'https://www.coindesk.com/price/tokens'
  },
  {
    // https://de.fi/account/0xd874387ebb001a6b0bea98072f8de05f8965e51e/dashboard/portfolio-overview
    regExp: /^https:\/\/de\.fi\/account\/[a-zA-Z0-9]+\/dashboard\/portfolio-overview$/,
    url: 'https://de.fi/account/'
  },
  {
    // https://decrypt.co/197988/how-to-get-a-refund-for-fortnite-from-epic-games
    regExp: /^https:\/\/decrypt\.co\/[0-9]+\/[a-z0-9-]+$/,
    url: 'https://decrypt.co/articles'
  },
  {
    // https://cryptopotato.com/is-ripple-xrp-about-to-outperform-ethereum-eth-by-500/
    regExp: /^https:\/\/cryptopotato\.com\/[a-z0-9-]+\/$/,
    url: 'https://cryptopotato.com/articles'
  },
  {
    // https://news.bitcoin.com/secs-crypto-chief-signals-ramp-up-in-enforcement-were-going-to-continue-to-bring-those-charges/
    regExp: /^https:\/\/news\.bitcoin\.com\/[a-z0-9-]+\/$/,
    url: 'https://news.bitcoin.com/articles'
  },
  {
    // https://cryptonews.com/news/next-pepe-coin-make-crypto-millionaires-wall-street-memes-presale-ends-4-days.htm
    regExp: /^https:\/\/cryptonews\.com\/news\/[a-z0-9.-]+$/,
    url: 'https://cryptonews.com/news/articles'
  },
  {
    // https://bitcoinmagazine.com/business/over-50-of-us-bitcoin-miners-to-back-new-policy-group
    regExp: /^https:\/\/bitcoinmagazine\.com\/[a-z]+\/[a-z0-9-]+$/,
    url: 'https://bitcoinmagazine.com/articles'
  },
  {
    // https://ambcrypto.com/will-polkadots-usdc-integration-boost-the-network/
    regExp: /^https:\/\/ambcrypto\.com\/[a-z0-9-]+\/$/,
    url: 'https://ambcrypto.com/articles'
  },
  {
    // https://www.investopedia.com/crypto-adoption-flatlined-as-fomo-turned-into-buyer-s-remorse-in-2022-7971317
    regExp: /^https:\/\/www\.investopedia\.com\/[a-z0-9-]+$/,
    url: 'https://investopedia.com/articles'
  },
  {
    // https://thecryptobasic.com/2023/09/20/bybit-lists-paypal-usd-pyusd-stablecoin-for-spot-trading/
    regExp: /^https:\/\/thecryptobasic\.com\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+\/$/,
    url: 'https://thecryptobasic.com/articles'
  },
  {
    // https://beincrypto.com/ltc-price-breaks-out-double-bottom-pattern/
    regExp: /^https:\/\/beincrypto\.com\/[a-z0-9-]+\/$/,
    url: 'https://beincrypto.com/articles'
  },
  {
    // https://beincrypto.com/price/bitcoin/
    regExp: /^https:\/\/beincrypto\.com\/price\/[a-z-]+\/$/,
    url: 'https://beincrypto.com/price/tokens'
  },
  {
    // https://blockworks.co/news/hal-finney-bitcoin-satoshi-nakamoto-zk-proofs
    regExp: /^https:\/\/blockworks\.co\/news\/[a-z0-9-]+$/,
    url: 'https://blockworks.co/news/articles'
  },
  {
    // https://www.tradingview.com/symbols/BTCUSD/?exchange=CRYPTO
    regExp: /^https:\/\/www\.tradingview\.com\/symbols\/[A-Z]+\/\?exchange=CRYPTO$/,
    url: 'https://www.tradingview.com/symbols/tokens'
  },
  {
    // https://www.tradingview.com/chart/ARBUSDT/DCKdJWUH-Long-trade-12-for-Arbitrum-ARB-price/
    regExp: /^https:\/\/www\.tradingview\.com\/chart\/[A-Z]+\/[A-Za-z0-9-]+\/$/,
    url: 'https://www.tradingview.com/chart/articles'
  },
  {
    // https://cryptoslate.com/celsius-to-purchase-45m-core-scientific-mining-facility-as-part-of-bankruptcy-settlement/
    regExp: /^https:\/\/cryptoslate\.com\/[a-z0-9-]+\/$/,
    url: 'https://cryptoslate.com/articles'
  },
  {
    // https://cryptoslate.com/coins/bitcoin/
    regExp: /^https:\/\/cryptoslate\.com\/coins\/[a-z0-9-]+\/$/,
    url: 'https://cryptoslate.com/coins/tokens'
  },
  {
    // https://xtz.news/defi/plenty-set-to-launch-advanced-v3-decentralized-exchange-on-tezos-today/
    regExp: /^https:\/\/xtz\.news\/[a-z-]+\/[a-z0-9-]+\/$/,
    url: 'https://xtz.news/articles'
  },
  {
    // https://www.investing.com/news/economy/futures-dither-after-wall-st-rout-fed-rate-verdict-in-focus-3176453
    regExp: /^https:\/\/investing\.com\/news\/[a-z-]+\/[a-z0-9-]+$/,
    url: 'https://www.investing.com/news/articles'
  },
  {
    // https://www.investing.com/crypto/bitcoin
    regExp: /^https:\/\/investing\.com\/crypto\/[a-z-]+$/,
    url: 'https://www.investing.com/crypto/tokens'
  },
  {
    // https://cointelegraph.com/ethereum-price
    regExp: /^https:\/\/cointelegraph\.com\/[a-z-]+(-price)$/,
    url: 'https://cointelegraph.com/tokens'
  }
];

// https://tzkt.io/KT1WT8hZsixALTmxcM3SDzCyh4UF8hYXVaUb/operations
export const tzktTokenOrAccountRegExp = /^https:\/\/tzkt\.io\/[a-zA-Z0-9]+\/operations$/;

// https://tzkt.io/ooSNf4vavf8Eo6UmiBKnSPfLjESqHwbtumh4kzYAFtiAo9XVEY9/69189236
export const tzktOpHashRegExp = /https:\/\/tzkt\.io\/([^/]+)/;

// https://www.coindesk.com/policy/2023/08/11/sam-bankman-fried-jailed-ahead-of-trial/
export const coindeskArticlesRegExp =
  /^https:\/\/www\.coindesk\.com\/(policy|tech|business|markets)\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+\/$/;

export const EXACT_MATCH_URLS = [
  'https://tzkt.io',

  'https://etherscan.io/',

  'https://bscscan.com/',

  'https://polygonscan.com/',

  'https://tronscan.org/#/',

  'https://arbiscan.io/',

  'https://www.livecoinwatch.com/',

  'https://www.coindesk.com/',
  'https://www.coindesk.com/policy/',
  'https://www.coindesk.com/tech/',
  'https://www.coindesk.com/business/',
  'https://www.coindesk.com/markets/',
  'https://www.coindesk.com/data/',

  'https://decrypt.co/',
  'https://decrypt.co/news',

  'https://dappradar.com/rankings/explorer/',

  'https://u.today/latest-cryptocurrency-news',
  'https://u.today/bitcoin-news',
  'https://u.today/ripple-news',
  'https://u.today/meme-cryptocurrencies',

  'https://cryptopotato.com/',
  'https://cryptopotato.com/crypto-news/',
  'https://cryptopotato.com/bitcoin-price-analysis/',
  'https://cryptopotato.com/ethereum-price-analysis/',
  'https://cryptopotato.com/ripple-price-analysis/',

  'https://cryptonews.com/',
  'https://cryptonews.com/news/',

  'https://coincodex.com/',
  'https://coincodex.com/news/',

  'https://news.bitcoin.com/',

  'https://bitcoinmagazine.com/',
  'https://bitcoinmagazine.com/articles',

  'https://www.investopedia.com/',
  'https://www.investopedia.com/cryptocurrency-news-5114163',

  'https://www.cnbc.com/cryptocurrency/',

  'https://ambcrypto.com/',
  'https://ambcrypto.com/category/new-news/',

  'https://thecryptobasic.com/',
  'https://thecryptobasic.com/category/latest-crypto-news/',

  'https://beincrypto.com/',
  'https://beincrypto.com/news/',
  'https://beincrypto.com/bitcoin-news/',
  'https://beincrypto.com/altcoin-news/',
  'https://beincrypto.com/price/',

  'https://blockworks.co/news',

  'https://www.tradingview.com/markets/cryptocurrencies/',
  'https://www.tradingview.com/markets/cryptocurrencies/ideas/',

  'https://cryptoslate.com/',
  'https://cryptoslate.com/top-news/',
  'https://cryptoslate.com/coins/',

  'https://xtz.news/',
  'https://xtz.news/category/latest-news/',

  'https://www.investing.com/',

  'https://dappradar.com/rankings/explorer',
  'https://dappradar.com/rankings',
  'https://dappradar.com/rankings/tokens',

  'https://cointelegraph.com/',

  'https://coinmarketcap.com/coins/',

  'https://www.reddit.com/r/Bitcoin/',

  'https://magic.store/',
  'https://magic.store/apps',
  'https://magic.store/upcoming',
  'https://magic.store/games'
];

export const STARTS_WITH_URLS = [
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
  'https://tronscan.org/#/token',

  'https://cointelegraph.com/news',

  'https://www.coingecko.com/en/exchanges',

  'https://www.cnbc.com/quotes',

  'https://blockworks.co/category',

  'https://coincodex.com/article',
  'https://coincodex.com/crypto',

  'https://www.investing.com/indices',

  'https://www.dappt.io/app',

  'https://coinmarketcap.com/currencies',

  'https://www.reddit.com/r/Bitcoin/comments'
];
