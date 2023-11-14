import ecc from '@bitcoinerlab/secp256k1';
import BIP32Factory from 'bip32';
import * as Bip39 from 'bip39';
import * as Bitcoin from 'bitcoinjs-lib';

const testnet = Bitcoin.networks.testnet;
const GAP_LIMIT = 10;

export const generateBitcoinAddressesFromMnemonic = (mnemonic: string) => {
  const seed = Bip39.mnemonicToSeedSync(mnemonic);

  const bip32 = BIP32Factory(ecc);
  const root = bip32.fromSeed(seed, testnet);

  const addresses = [];

  for (let i = 0; i < GAP_LIMIT; i++) {
    const currentChild = root.derivePath(`m/84'/0'/0'/0/${i}`);

    addresses.push(Bitcoin.payments.p2wpkh({ pubkey: currentChild.publicKey, network: testnet }).address);
  }

  return addresses;
};

export const getBitcoinAddress = () => {
  return generatedAddresses[0];
};

export const getAllBitcoinAddressesForCurrentMnemonic = () => {
  return generatedAddresses;
};

const generatedAddresses = [
  'tb1qufwmqnja8v8knrkd0uej5v50m770z8nsfw2736',
  'tb1q32znzr8hr95eed0tagjn6jy4pgt6w7macc0zul',
  'tb1qdlcmn58ndpc8z57tnme2vfd0r7k8dk9kadptdg',
  'tb1qhgmj86ky09sx2g7v8fqczugmuq4regvfntvwv6',
  'tb1q3p44wkeslyschpxwl0pl7l3wrdw7k4jvnxjwup',
  'tb1qlyprq7l54a2uyxtpfjp85zxg9uvr8crnsggtvq',
  'tb1qjy2m5wskt4kaadmwmjpfnn70amx3zh9fmn2ags',
  'tb1q0sd9fvj60em285fkrd2ukr5h4qvrmx9qamtaq6',
  'tb1qgkzuznnwd6yg3klcsxrg4z7hn5p0shaqjxusxc',
  'tb1qae32d9fhf6m7qjsmf6dt2esj5m3tkt9uzs5z3v'
];
