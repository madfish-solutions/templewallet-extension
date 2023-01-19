import axios from 'axios';

const host = process.env.TEMPLE_WALLET_API_HOST || 'https://temple-api-mainnet.prod.templewallet.com';

export const templeWalletApi = axios.create({ baseURL: `${host}/api` });
