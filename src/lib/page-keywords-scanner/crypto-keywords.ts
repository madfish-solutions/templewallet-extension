/**
 * Comprehensive list of crypto/ blockchain-related keywords.
 */

export interface KeywordMatch {
  keyword: string;
  category: KeywordCategory;
  count: number;
}

export type KeywordCategory =
  | 'cryptocurrency'
  | 'blockchain'
  | 'defi'
  | 'nft'
  | 'exchange'
  | 'wallet'
  | 'trading'
  | 'staking'
  | 'layer2'
  | 'web3';

interface KeywordDefinition {
  category: KeywordCategory;
  wholeWord?: boolean;
}

/**
 * Keyword dictionary with categories.
 */
export const CRYPTO_KEYWORDS: Record<string, KeywordDefinition> = {
  // Cryptocurrencies
  bitcoin: { category: 'cryptocurrency' },
  btc: { category: 'cryptocurrency', wholeWord: true },
  ethereum: { category: 'cryptocurrency' },
  eth: { category: 'cryptocurrency', wholeWord: true },
  tezos: { category: 'cryptocurrency' },
  xtz: { category: 'cryptocurrency', wholeWord: true },
  solana: { category: 'cryptocurrency' },
  sol: { category: 'cryptocurrency', wholeWord: true },
  cardano: { category: 'cryptocurrency' },
  ada: { category: 'cryptocurrency', wholeWord: true },
  polkadot: { category: 'cryptocurrency' },
  dot: { category: 'cryptocurrency', wholeWord: true },
  avalanche: { category: 'cryptocurrency' },
  avax: { category: 'cryptocurrency', wholeWord: true },
  polygon: { category: 'cryptocurrency' },
  matic: { category: 'cryptocurrency', wholeWord: true },
  ripple: { category: 'cryptocurrency' },
  xrp: { category: 'cryptocurrency', wholeWord: true },
  dogecoin: { category: 'cryptocurrency' },
  doge: { category: 'cryptocurrency', wholeWord: true },
  litecoin: { category: 'cryptocurrency' },
  ltc: { category: 'cryptocurrency', wholeWord: true },
  chainlink: { category: 'cryptocurrency' },
  link: { category: 'cryptocurrency', wholeWord: true },
  uniswap: { category: 'cryptocurrency' },
  uni: { category: 'cryptocurrency', wholeWord: true },
  aave: { category: 'cryptocurrency' },
  maker: { category: 'cryptocurrency' },
  mkr: { category: 'cryptocurrency', wholeWord: true },
  cosmos: { category: 'cryptocurrency' },
  atom: { category: 'cryptocurrency', wholeWord: true },
  near: { category: 'cryptocurrency', wholeWord: true },
  algorand: { category: 'cryptocurrency' },
  algo: { category: 'cryptocurrency', wholeWord: true },
  fantom: { category: 'cryptocurrency' },
  ftm: { category: 'cryptocurrency', wholeWord: true },
  arbitrum: { category: 'cryptocurrency' },
  arb: { category: 'cryptocurrency', wholeWord: true },
  optimism: { category: 'cryptocurrency' },
  aptos: { category: 'cryptocurrency' },
  apt: { category: 'cryptocurrency', wholeWord: true },
  sui: { category: 'cryptocurrency', wholeWord: true },

  // Stablecoins
  usdt: { category: 'cryptocurrency', wholeWord: true },
  tether: { category: 'cryptocurrency' },
  usdc: { category: 'cryptocurrency', wholeWord: true },
  dai: { category: 'cryptocurrency', wholeWord: true },
  busd: { category: 'cryptocurrency', wholeWord: true },
  stablecoin: { category: 'cryptocurrency' },
  stablecoins: { category: 'cryptocurrency' },

  // Blockchain terms
  blockchain: { category: 'blockchain' },
  'block chain': { category: 'blockchain' },
  'smart contract': { category: 'blockchain' },
  'smart contracts': { category: 'blockchain' },
  smartcontract: { category: 'blockchain' },
  decentralized: { category: 'blockchain' },
  decentralised: { category: 'blockchain' },
  consensus: { category: 'blockchain' },
  'proof of work': { category: 'blockchain' },
  'proof of stake': { category: 'blockchain' },
  pow: { category: 'blockchain', wholeWord: true },
  pos: { category: 'blockchain', wholeWord: true },
  hashrate: { category: 'blockchain' },
  'hash rate': { category: 'blockchain' },
  mining: { category: 'blockchain' },
  miner: { category: 'blockchain' },
  node: { category: 'blockchain', wholeWord: true },
  validator: { category: 'blockchain' },
  validators: { category: 'blockchain' },
  mainnet: { category: 'blockchain' },
  testnet: { category: 'blockchain' },
  fork: { category: 'blockchain', wholeWord: true },
  'hard fork': { category: 'blockchain' },
  'soft fork': { category: 'blockchain' },
  halving: { category: 'blockchain' },
  'gas fee': { category: 'blockchain' },
  'gas fees': { category: 'blockchain' },
  gwei: { category: 'blockchain' },

  // DeFi
  defi: { category: 'defi' },
  'decentralized finance': { category: 'defi' },
  yield: { category: 'defi', wholeWord: true },
  'yield farming': { category: 'defi' },
  'liquidity pool': { category: 'defi' },
  'liquidity pools': { category: 'defi' },
  'liquidity provider': { category: 'defi' },
  amm: { category: 'defi', wholeWord: true },
  'automated market maker': { category: 'defi' },
  dex: { category: 'defi', wholeWord: true },
  swap: { category: 'defi', wholeWord: true },
  'flash loan': { category: 'defi' },
  tvl: { category: 'defi', wholeWord: true },
  'total value locked': { category: 'defi' },
  impermanent: { category: 'defi' },
  slippage: { category: 'defi' },
  apr: { category: 'defi', wholeWord: true },
  apy: { category: 'defi', wholeWord: true },
  lending: { category: 'defi' },
  borrowing: { category: 'defi' },
  collateral: { category: 'defi' },
  vault: { category: 'defi', wholeWord: true },
  vaults: { category: 'defi' },

  // NFT
  nft: { category: 'nft', wholeWord: true },
  nfts: { category: 'nft' },
  'non-fungible': { category: 'nft' },
  'non fungible': { category: 'nft' },
  collectible: { category: 'nft' },
  collectibles: { category: 'nft' },
  'digital art': { category: 'nft' },
  opensea: { category: 'nft' },
  rarible: { category: 'nft' },
  pfp: { category: 'nft', wholeWord: true },
  mint: { category: 'nft', wholeWord: true },
  minting: { category: 'nft' },
  airdrop: { category: 'nft' },
  whitelist: { category: 'nft' },
  rarity: { category: 'nft' },

  // Exchanges
  exchange: { category: 'exchange' },
  binance: { category: 'exchange' },
  coinbase: { category: 'exchange' },
  kraken: { category: 'exchange' },
  kucoin: { category: 'exchange' },
  bybit: { category: 'exchange' },
  okx: { category: 'exchange', wholeWord: true },
  huobi: { category: 'exchange' },
  ftx: { category: 'exchange', wholeWord: true },
  gemini: { category: 'exchange' },
  bitstamp: { category: 'exchange' },
  cex: { category: 'exchange', wholeWord: true },

  // Wallet terms
  wallet: { category: 'wallet' },
  wallets: { category: 'wallet' },
  'hardware wallet': { category: 'wallet' },
  'cold wallet': { category: 'wallet' },
  'hot wallet': { category: 'wallet' },
  ledger: { category: 'wallet' },
  trezor: { category: 'wallet' },
  metamask: { category: 'wallet' },
  'seed phrase': { category: 'wallet' },
  'private key': { category: 'wallet' },
  'public key': { category: 'wallet' },
  mnemonic: { category: 'wallet' },
  custodial: { category: 'wallet' },
  'non-custodial': { category: 'wallet' },

  // Trading
  trading: { category: 'trading' },
  trader: { category: 'trading' },
  hodl: { category: 'trading' },
  hodling: { category: 'trading' },
  fomo: { category: 'trading', wholeWord: true },
  fud: { category: 'trading', wholeWord: true },
  bullish: { category: 'trading' },
  bearish: { category: 'trading' },
  'market cap': { category: 'trading' },
  marketcap: { category: 'trading' },
  'all-time high': { category: 'trading' },
  ath: { category: 'trading', wholeWord: true },
  'all-time low': { category: 'trading' },
  atl: { category: 'trading', wholeWord: true },
  leverage: { category: 'trading' },
  margin: { category: 'trading', wholeWord: true },
  'stop loss': { category: 'trading' },
  'take profit': { category: 'trading' },
  long: { category: 'trading', wholeWord: true },
  short: { category: 'trading', wholeWord: true },
  spot: { category: 'trading', wholeWord: true },
  futures: { category: 'trading' },
  'order book': { category: 'trading' },
  whale: { category: 'trading', wholeWord: true },
  whales: { category: 'trading' },
  pump: { category: 'trading', wholeWord: true },
  dump: { category: 'trading', wholeWord: true },
  'pump and dump': { category: 'trading' },
  altcoin: { category: 'trading' },
  altcoins: { category: 'trading' },
  shitcoin: { category: 'trading' },
  memecoin: { category: 'trading' },
  'meme coin': { category: 'trading' },

  // Staking
  staking: { category: 'staking' },
  stake: { category: 'staking', wholeWord: true },
  unstake: { category: 'staking' },
  unstaking: { category: 'staking' },
  delegation: { category: 'staking' },
  delegate: { category: 'staking' },
  baker: { category: 'staking' },
  baking: { category: 'staking' },
  rewards: { category: 'staking' },

  // Layer 2
  'layer 2': { category: 'layer2' },
  layer2: { category: 'layer2' },
  l2: { category: 'layer2', wholeWord: true },
  rollup: { category: 'layer2' },
  rollups: { category: 'layer2' },
  'zk-rollup': { category: 'layer2' },
  'optimistic rollup': { category: 'layer2' },
  sidechain: { category: 'layer2' },
  'lightning network': { category: 'layer2' },
  'state channel': { category: 'layer2' },

  // Web3
  web3: { category: 'web3' },
  'web 3': { category: 'web3' },
  dapp: { category: 'web3' },
  dapps: { category: 'web3' },
  dao: { category: 'web3', wholeWord: true },
  daos: { category: 'web3' },
  governance: { category: 'web3' },
  token: { category: 'web3', wholeWord: true },
  tokens: { category: 'web3' },
  tokenomics: { category: 'web3' },
  ico: { category: 'web3', wholeWord: true },
  ido: { category: 'web3', wholeWord: true },
  ieo: { category: 'web3', wholeWord: true },
  metaverse: { category: 'web3' },
  gamefi: { category: 'web3' },
  'play to earn': { category: 'web3' },
  'play-to-earn': { category: 'web3' },
  p2e: { category: 'web3', wholeWord: true },

  // Crypto general
  crypto: { category: 'cryptocurrency' },
  cryptocurrency: { category: 'cryptocurrency' },
  cryptocurrencies: { category: 'cryptocurrency' },
  'digital currency': { category: 'cryptocurrency' },
  'virtual currency': { category: 'cryptocurrency' },
  satoshi: { category: 'cryptocurrency' },
  sats: { category: 'cryptocurrency', wholeWord: true },
  'satoshi nakamoto': { category: 'cryptocurrency' }
};

/** Keywords that must match as whole words (3 chars or fewer, or explicitly marked) */
export const WHOLE_WORD_KEYWORDS = new Set(
  Object.entries(CRYPTO_KEYWORDS)
    .filter(([key, def]) => def.wholeWord || key.length <= 3)
    .map(([key]) => key)
);
