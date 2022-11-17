import axios from 'axios';

export const templeWalletApi = axios.create({ baseURL: 'https://temple-api-mainnet.prod.templewallet.com/api' });
