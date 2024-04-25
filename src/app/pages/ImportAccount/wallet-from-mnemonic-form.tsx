import React, { memo, useCallback, useState } from 'react';

import { Alert, Button } from 'app/atoms';
import { formatMnemonic } from 'app/defaults';
import { SeedPhraseInput, isSeedPhraseFilled } from 'app/templates/SeedPhraseInput';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';

import { defaultNumberOfWords } from './constants';

export const WalletFromMnemonicForm = memo(() => {
  const { createOrImportWallet } = useTempleClient();

  const [submitCount, setSubmitCount] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [seedError, setSeedError] = useState('');

  const [numberOfWords, setNumberOfWords] = useState(defaultNumberOfWords);

  const reset = useCallback(() => {
    setError('');
    setSeedError('');
  }, []);

  const handleSeedPhraseChange = useCallback((newSeedPhrase: string) => {
    setSeedPhrase(newSeedPhrase);
    setError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    setSubmitCount(x => x + 1);

    if (seedError || !isSeedPhraseFilled(seedPhrase)) {
      setSeedError(t('mnemonicWordsAmountConstraint', [numberOfWords]) as string);

      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createOrImportWallet(formatMnemonic(seedPhrase));
    } catch (err: any) {
      console.error(err);

      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [createOrImportWallet, isSubmitting, numberOfWords, seedError, seedPhrase]);

  return (
    <div className="w-full max-w-sm mx-auto my-8">
      {error && <Alert type="error" title={t('error')} autoFocus description={error} className="mb-6" />}

      <SeedPhraseInput
        submitted={submitCount !== 0}
        seedError={seedError}
        setSeedError={setSeedError}
        onChange={handleSeedPhraseChange}
        reset={reset}
        numberOfWords={numberOfWords}
        setNumberOfWords={setNumberOfWords}
      />

      <Button
        disabled={isSubmitting || Boolean(error)}
        className="w-full rounded-lg bg-orange-200 text-orange-20 leading-tight p-4 text-sm font-semibold"
        onClick={handleSubmit}
      >
        <T id="importWallet" />
      </Button>
    </div>
  );
});
