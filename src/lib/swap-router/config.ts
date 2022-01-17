// TODO: remove this from shared lib

export const TEZOS_DEXES_API_URL = 'ws://mainnet-node.madfish.xyz:3001/';

export const ROUTING_FEE_ADDRESS = 'tz1SjmTLHFW5UdBw7ZMmtqMZC8H1ZEpg6cRJ';

export const ROUTING_FEE_PERCENT = 0.5;

export const ROUTING_FEE_RATIO = (100 - ROUTING_FEE_PERCENT) / 100;
export const ROUTING_FEE_INVERTED_RATIO = 100 / (100 - ROUTING_FEE_PERCENT);

export const TRANSACTION_LIFE_MINUTES = 20;
