import axios, { AxiosError } from 'axios';
import crypto from 'crypto';

const HOSTNAME = '';
const API_KEY = '';
const SECRET = '';

const generateHmac = (data: string, nonce: number) => {
  const localSignature = crypto.createHmac('SHA256', SECRET).update(data).digest('hex');

  return `${API_KEY}:${localSignature}:${nonce}`;
};

const sendGetRequest = async <R>(path: string) => {
  const nonce = Date.now();
  const data = 'GET\n' + path + '\n' + nonce;

  const authHeader = generateHmac(data, nonce);
  try {
    const response = await axios.get<R>(HOSTNAME + path, {
      headers: {
        Authorization: 'Bearer ' + authHeader,
        'Content-Type': 'application/json'
      }
    });

    console.log('Banxa GET response:', response);

    return response;
  } catch (error) {
    console.error('Banxa GET error:', { error: (error as AxiosError).response?.data });

    throw error;
  }
};

const sendPostRequest = async <R>(path: string, payload: string) => {
  const nonce = Date.now();
  const data = 'POST\n' + path + '\n' + nonce + '\n' + payload;

  const authHeader = generateHmac(data, nonce);
  try {
    const response = await axios.post<R>(HOSTNAME + path, payload, {
      // method: 'POST',
      // url: HOSTNAME + path,
      data: payload,
      headers: {
        Authorization: 'Bearer ' + authHeader,
        'Content-Type': 'application/json'
      }
    });

    console.log('Banxa POST response:', response);

    return response;
  } catch (error) {
    console.error('Banxa POST error:', { error: (error as AxiosError).response?.data });

    throw error;
  }
};

// sendGetRequest('/api/countries');

const purchase_reference = Date.now().toString();

sendPostRequest(
  '/api/orders/nft/buy',
  JSON.stringify({
    account_reference: 'tz1TUAXvQU18pqrHUn3CnndCXLcKQxMB2Vsy',
    source: 'USD',
    source_amount: '25',
    target: 'XTZ',
    blockchain: 'XTZ',
    return_url_on_success: 'https://test.com',
    wallet_address: 'tz1TUAXvQU18pqrHUn3CnndCXLcKQxMB2Vsy',
    //
    purchase_reference,
    //
    meta_data: {
      purchase_reference,
      nft: {
        contract_address: 'KT1CzVSa18hndYupV9NcXy3Qj7p8YFDZKVQv',
        token_id: '12'
        // name: 'Banxa nft',
        // collection: 'Banxa NFT shop',
        // media: { type: 'image', link: 'https://ipfs.example.cloud/ipfs/QmTWyo67Vd4GNVkbBCs96ddXnZZEJy41Cjc9DkcQRt41Np' }
      }
    }
  })
);
