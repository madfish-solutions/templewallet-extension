import { Given } from '@cucumber/cucumber';

import { Pages } from '../page-objects';
import { getElementText } from '../utils/search.utils';

let temporaryMnemonic = '';

Given(/I save my mnemonic/, async () => {
  // @ts-ignore
  temporaryMnemonic = await Pages.NewSeedBackup.seedPhraseValue.getText();
});

Given(/I verify my mnemonic/, async () => {
  const labels = await Pages.VerifyMnemonic.getWordsLabels();
  const labelsValues = await Promise.all(labels.map(item => getElementText(item)));
  const sixWordsNumbers = labelsValues.map(str => Number(str!.split(' ')[1]!));

  const inputs = await Pages.VerifyMnemonic.getWordsInputs();
  const inputsValues = await Promise.all(inputs.map(elem => getElementText(elem)));
  const twoEmptyIndexes = inputsValues
    .map((str, index) => {
      if (str) return undefined;
      return index;
    })
    .filter(index => index !== undefined);

  const firstEmptyIndex = twoEmptyIndexes[0]!;
  const secondEmptyIndex = twoEmptyIndexes[1]!;

  const firstWordNumber = sixWordsNumbers[firstEmptyIndex]!;
  const secondWordNumber = sixWordsNumbers[secondEmptyIndex]!;

  const mnemonic = temporaryMnemonic.split(' ');

  const firstWord = mnemonic[firstWordNumber - 1]!;
  const secondWord = mnemonic[secondWordNumber - 1]!;

  const firstInput = inputs[firstEmptyIndex]!;
  const secondInput = inputs[secondEmptyIndex]!;

  await firstInput.type(firstWord);
  await secondInput.type(secondWord);
});
