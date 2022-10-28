import axios from 'axios';

export const templeWalletApi = axios.create({ baseURL: 'https://api.templewallet.com/api' });
