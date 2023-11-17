import ecc from '@bitcoinerlab/secp256k1';
import BIP32Factory, { BIP32Interface } from 'bip32';
import * as Bip39 from 'bip39';
import * as Bitcoin from 'bitcoinjs-lib';

import { btcWalletAddressesUpdated } from '../lib/temple/back/store';

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

  return { address: getBitcoinAddress(keyPair, testnet)!, privateKey: keyPair.toBase58() };
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

const OUTPUTS_COUNT = 2;

export const sendBitcoin = async (
  receiverAddress: string,
  amount: string,
  addressKeyPairsRecord: Record<string, string>,
  createNewBtcAddress: () => Promise<string[]>
): Promise<string> => {
  const userAddressesConcat = Object.keys(addressKeyPairsRecord).slice(-7).join(';');

  const satoshiToSend = Number((Number(amount) * 100000000).toFixed());
  console.log(satoshiToSend, 'amount');

  const response = await fetch(`http://localhost:3000/api/bitcoin-utxos?addresses=${userAddressesConcat}`);
  const utxoResponse: UtxoResponse[] = await response.json();
  console.log(utxoResponse, 'utxoResponse');

  const allUtxos = utxoResponse.flatMap(({ utxos }) => utxos);

  const totalAmountAvailable = allUtxos.reduce((acc, utxo) => (acc += utxo.value), 0);
  console.log(totalAmountAvailable, 'totalAmount');

  const psbt = new Bitcoin.Psbt({ network: testnet });
  const bip32 = BIP32Factory(ecc);

  console.log(psbt, 'psbt1');

  // Add inputs
  utxoResponse.forEach(({ address, utxos }) => {
    utxos.forEach(utxo => {
      const signer = bip32.fromBase58(addressKeyPairsRecord[address], testnet);
      const payment = Bitcoin.payments.p2wpkh({ pubkey: signer.publicKey, network: testnet });

      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: payment.output!,
          value: utxo.value
        }
      });
    });
  });

  const transactionSize = psbt.inputCount * 146 + OUTPUTS_COUNT * 34 + 10 - psbt.inputCount;

  const fee = transactionSize; // for testnet
  console.log(fee, 'fee');

  const change = totalAmountAvailable - satoshiToSend - fee;

  console.log(change, 'change');

  // Check if we have enough funds to cover the transaction
  if (change < 0) {
    throw new Error('Balance is too low for this transaction');
  }

  console.log(psbt.inputCount, 'inputsCount');

  // set the receiving address and the amount to send
  psbt.addOutput({ address: receiverAddress, value: satoshiToSend });

  // set the change address and the amount to send
  if (change > 0) {
    const allAddresses = await createNewBtcAddress();
    btcWalletAddressesUpdated(allAddresses);
    const changeAddress = allAddresses[allAddresses.length - 1];
    console.log(changeAddress, 'changeAddress');
    psbt.addOutput({ address: changeAddress, value: change });
  }

  let currentInputIndex = 0;

  // Sign the inputs
  utxoResponse.forEach(({ address, utxos }) => {
    utxos.forEach((_, index) => {
      console.log('sign', index);
      const signer = bip32.fromBase58(addressKeyPairsRecord[address], testnet);
      psbt.signInput(currentInputIndex, signer);
      currentInputIndex++;
    });
  });

  console.log('signed normally');

  console.log(psbt, 'psbt2');

  psbt.finalizeAllInputs();

  // serialized transaction
  const txHex = psbt.extractTransaction().toHex();
  console.log(txHex, 'txHex');

  const txId = await broadcastTransaction(txHex);
  console.log(txId, 'txId');

  return txId;
};

const broadcastTransaction = async (txHex: string) => {
  try {
    const response = await fetch(`http://localhost:3000/api/bitcoin-broadcast-tx?txHex=${txHex}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();

    return data.tx.hash;
  } catch (error) {
    console.error('Error broadcasting transaction:', error);
  }
};
