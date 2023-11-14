import { ethers } from 'ethers';

export const getEvmWalletFromMnemonic = (mnemonic: string, derivationPath: string) => {
  try {
    const wallet = ethers.Wallet.fromPhrase(mnemonic);

    return wallet.derivePath(derivationPath);
  } catch (e) {
    console.error(e);
    return;
  }
};
