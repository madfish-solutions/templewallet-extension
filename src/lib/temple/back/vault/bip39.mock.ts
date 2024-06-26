const OriginalBIP39 = jest.requireActual('bip39');

const generateMnemonicMock = jest.fn(OriginalBIP39.generateMnemonic);

const setGeneratedMnemonicOnce = (mnemonic: string) => {
  generateMnemonicMock.mockReturnValueOnce(mnemonic);
};

const bip39Mock = {
  ...OriginalBIP39,
  generateMnemonic: generateMnemonicMock
};

jest.mock('bip39', () => bip39Mock);

export { setGeneratedMnemonicOnce };
