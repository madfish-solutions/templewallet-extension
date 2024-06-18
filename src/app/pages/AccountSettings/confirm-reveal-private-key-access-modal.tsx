import React, { memo, useCallback } from 'react';

import { FormField } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { useTempleBackendActionForm } from 'app/hooks/use-temple-backend-action-form';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { StoredAccount } from 'lib/temple/types';
import { isTruthy } from 'lib/utils';
import { getAccountAddressForChain } from 'temple/accounts';
import { TempleChainKind } from 'temple/types';

import { AccountSettingsSelectors } from './selectors';
import { PrivateKeyPayload } from './types';

interface ConfirmRevealPrivateKeyAccessModalProps {
  account: StoredAccount;
  onClose: EmptyFn;
  onReveal: (privateKeys: PrivateKeyPayload[]) => void;
}

interface FormData {
  password: string;
}

export const ConfirmRevealPrivateKeyAccessModal = memo<ConfirmRevealPrivateKeyAccessModalProps>(
  ({ account, onClose, onReveal }) => {
    const { revealPrivateKey } = useTempleClient();

    const revealSecretKeys = useCallback(
      async ({ password }: FormData) => {
        const rawPayloads = await Promise.all(
          [TempleChainKind.EVM, TempleChainKind.Tezos].map(async chainName => {
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
      <ActionModal title={t('confirmAccess')} onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ActionModalBodyContainer>
            <FormField
              ref={register({ required: t('required') })}
              label={t('enterPasswordToRevealPrivateKey')}
              labelContainerClassName="text-grey-2"
              id="revealprivatekey-secret-password"
              type="password"
              name="password"
              placeholder={t('password')}
              errorCaption={errors.password?.message}
              containerClassName="mb-1"
              testID={AccountSettingsSelectors.passwordInput}
            />
          </ActionModalBodyContainer>
          <ActionModalButtonsContainer>
            <ActionModalButton
              color="primary"
              disabled={submitting}
              type="submit"
              testID={AccountSettingsSelectors.confirmRevealPrivateKeyButton}
            >
              <T id="revealPrivateKey" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </form>
      </ActionModal>
    );
  }
);
