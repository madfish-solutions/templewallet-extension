import React, { memo, useCallback, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import PageLayout from 'app/layouts/PageLayout';
import { CreatePasswordForm } from 'app/templates/CreatePasswordForm';
import { ImportSeedForm } from 'app/templates/ImportSeedForm';
import { t } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { NullComponent } from 'lib/ui/null-component';
import { navigate } from 'lib/woozie';

const goHome = () => navigate('/');

export const ImportWallet = memo(() => {
  const [seedPhrase, setSeedPhrase] = useState<string | undefined>();
  const [shouldShowPasswordForm, showPasswordForm, hidePasswordForm] = useBooleanState(false);

  const handleSeedPhraseSubmit = useCallback(
    (seed: string) => {
      setSeedPhrase(seed);
      showPasswordForm();
    },
    [showPasswordForm]
  );

  const handleGoBack = useCallback(
    () => void (shouldShowPasswordForm && hidePasswordForm()),
    [hidePasswordForm, shouldShowPasswordForm]
  );

  return (
    <PageLayout Header={NullComponent} contentPadding={false}>
      <PageModal
        title={t(shouldShowPasswordForm ? 'createPassword' : 'importExistingWallet')}
        opened
        onGoBack={shouldShowPasswordForm ? handleGoBack : undefined}
        onRequestClose={goHome}
      >
        <SuspenseContainer>
          {shouldShowPasswordForm ? (
            <CreatePasswordForm seedPhrase={seedPhrase} />
          ) : (
            <ImportSeedForm next={handleSeedPhraseSubmit} />
          )}
        </SuspenseContainer>
      </PageModal>

      <div className="flex-1 flex flex-col px-4 pb-8 h-full" />
    </PageLayout>
  );
});
