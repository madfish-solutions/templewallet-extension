import ecc from '@bitcoinerlab/secp256k1';
import axios from 'axios';
import BIP32Factory, { BIP32Interface } from 'bip32';
import * as Bip39 from 'bip39';
import * as Bitcoin from 'bitcoinjs-lib';

const testnet = Bitcoin.networks.testnet;

// SegWit
const getBitcoinAddress = (node: BIP32Interface, network: Bitcoin.networks.Network) =>
  Bitcoin.payments.p2wpkh({ pubkey: node.publicKey, network }).address;

export const getBitcoinXPubFromMnemonic = (mnemonic: string) => {
  const seed = Bip39.mnemonicToSeedSync(mnemonic);
  const bip32 = BIP32Factory(ecc);

  return bip32.fromSeed(seed, testnet);
};

export const getNextBitcoinHDWallet = (hdMaster: BIP32Interface, index: number) => {
  const keyPair = hdMaster.derivePath(`m/84'/0'/0'/0/${index}`);

  return { address: getBitcoinAddress(keyPair, testnet), keyPair };
};

interface UnspentOutput {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  value: number;
}

interface UtxoResponse {
  address: string;
  utxos: UnspentOutput[];
}

interface UtxoInput {
  hash: string;
  index: number;
}

const OUTPUTS_COUNT = 2;

export const sendBitcoin = async (
  addressKeyPairsRecord: Record<string, BIP32Interface>,
  receiverAddress: string,
  changeAddress: string,
  amount: string
): Promise<string> => {
  const userAddresses: string[] = [];

  const satoshiToSend = Number(amount) * 100000000;

  const { data: utxoResponse } = await axios.get<UtxoResponse[]>(
    `http://localhost:3000/api/bitcoin-utxos?addresses=${userAddresses}`
  );

  const allUtxos = utxoResponse.flatMap(({ utxos }) => utxos);
  console.log(allUtxos, 'allUtxos');
  const inputs: UtxoInput[] = allUtxos.map(utxo => ({ hash: utxo.txid, index: utxo.vout }));
  console.log(inputs, 'inputs');

  const totalAmountAvailable = allUtxos.reduce((acc, utxo) => (acc += utxo.value), 0);
  console.log(totalAmountAvailable, 'totalAmount');
  const inputsCount = inputs.length;

  const transactionSize = inputsCount * 146 + OUTPUTS_COUNT * 34 + 10 - inputsCount;
  console.log(transactionSize, 'transactrionSize');

  const fee = transactionSize * 20;
  const change = totalAmountAvailable - satoshiToSend - fee;

  console.log(fee, 'fee');
  console.log(change, 'change');

  // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte
  if (change < 0) {
    throw new Error('Balance is too low for this transaction');
  }

  const psbt = new Bitcoin.Psbt();

  //Set transaction input
  psbt.addInputs(inputs);

  // set the receiving address and the amount to send
  psbt.addOutput({ address: receiverAddress, value: satoshiToSend });

  // set the change address and the amount to send
  psbt.addOutput({ address: changeAddress, value: change });

  // Transaction signing
  utxoResponse.forEach(({ address, utxos }) =>
    utxos.forEach(utxo => psbt.signInputHD(utxo.vout, addressKeyPairsRecord[address]))
  );

  // serialized transaction
  const txHex = psbt.extractTransaction().toHex();
  console.log(txHex, 'txHex');

  const txId = await broadcastTransaction(txHex);
  console.log(txId, 'txId');

  return txId;
};

const broadcastTransaction = async (txHex: string) => {
  try {
    const response = await axios.post('https://blockstream.info/api/tx', txHex);

    if (response.status === 200) {
      console.log('Transaction successfully broadcasted!');
      console.log('Transaction ID:', response.data);

      return response.data;
    } else {
      console.error('Failed to broadcast transaction. Response:', response.status, response.data);
    }
  } catch (error: any) {
    console.error('Error broadcasting transaction:', error.message);
  }
};
