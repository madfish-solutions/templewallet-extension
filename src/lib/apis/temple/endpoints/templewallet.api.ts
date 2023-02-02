import axios from 'axios';

const TEMPLE_WALLET_API_URL = process.env.TEMPLE_WALLET_API_URL;

if (!TEMPLE_WALLET_API_URL) {
  throw new Error('process.env.TEMPLE_WALLET_API_URL is not defined');
}

export const templeWalletApi = axios.create({ baseURL: TEMPLE_WALLET_API_URL + '/api' });
