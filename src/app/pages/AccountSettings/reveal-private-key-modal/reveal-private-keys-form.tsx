import React, { memo, useCallback } from 'react';

import { FormField } from 'app/atoms';
import { ActionModalBodyContainer, ActionModalButton, ActionModalButtonsContainer } from 'app/atoms/action-modal';
import { useTempleBackendActionForm } from 'app/hooks/use-temple-backend-action-form';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { StoredAccount } from 'lib/temple/types';
import { isTruthy } from 'lib/utils';
import { getAccountAddressForChain } from 'temple/accounts';
import { TempleChainName } from 'temple/types';

import { PrivateKeyPayload } from './types';

interface RevealPrivateKeysFormProps {
  onReveal: (privateKeys: PrivateKeyPayload[]) => void;
  account: StoredAccount;
}

interface FormData {
  password: string;
}

export const RevealPrivateKeysForm = memo<RevealPrivateKeysFormProps>(({ onReveal, account }) => {
  const { revealPrivateKey } = useTempleClient();

  const revealSecretKeys = useCallback(
    async ({ password }: FormData) => {
      const rawPayloads = await Promise.all(
        [TempleChainName.EVM, TempleChainName.Tezos].map(async chainName => {
          const accountAddress = getAccountAddressForChain(account, chainName);

          return accountAddress
            ? {
                chain: chainName,
                address: accountAddress,
                privateKey: await revealPrivateKey(accountAddress, password)
              }
            : null;
        })
      );

      onReveal(rawPayloads.filter(isTruthy));
    },
    [account, onReveal, revealPrivateKey]
  );

  const { register, handleSubmit, errors, formState, onSubmit } = useTempleBackendActionForm<FormData>(
    revealSecretKeys,
    'password'
  );
  const submitting = formState.isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ActionModalBodyContainer>
        <FormField
          ref={register({ required: t('required') })}
          label={t('revealPrivateKeyPasswordLabel')}
          id="revealprivatekey-secret-password"
          type="password"
          name="password"
          placeholder="********"
          errorCaption={errors.password?.message}
          containerClassName="mb-1"
        />
      </ActionModalBodyContainer>
      <ActionModalButtonsContainer>
        <ActionModalButton className="bg-orange-20 text-white" disabled={submitting} type="submit">
          <T id="revealPrivateKey" />
        </ActionModalButton>
      </ActionModalButtonsContainer>
    </form>
  );
});
