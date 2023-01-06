import { defaultSeedPhrase, defaultPassword } from '../classes/browser-context.class';

export const getInputText = (inputType: string) => {
  let inputText = '';

  switch (inputType) {
    case 'seed':
      inputText = defaultSeedPhrase;
      break;
    case 'password':
      inputText = defaultPassword;
      break;
  }

  return inputText;
};
