import React, { memo, useCallback } from 'react';

import { Controller, useForm } from 'react-hook-form-v7';

import { FormField } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { Tooltip } from 'app/atoms/Tooltip';
import { T, t } from 'lib/i18n';
import { validateDerivationPath } from 'lib/temple/front';
import { shouldDisableSubmitButton } from 'lib/ui/should-disable-submit-button';
import { TempleChainKind } from 'temple/types';

import { ConnectLedgerModalSelectors } from '../selectors';

export interface CustomPathFormData {
  indexOrPath: string;
}

interface CustomPathModalProps {
  alreadyInWalletIndexes: number[];
  alreadyInTmpListIndexes: number[];
  chain: TempleChainKind;
  onClose: SyncFn<void>;
  onSubmit: (formData: CustomPathFormData) => Promise<void>;
}

export const CustomPathModal = memo<CustomPathModalProps>(
  ({ alreadyInWalletIndexes, alreadyInTmpListIndexes, chain, onClose, onSubmit }) => {
    const { control, handleSubmit, formState } = useForm<CustomPathFormData>({ defaultValues: { indexOrPath: '' } });
    const { errors } = formState;
    const isEvm = chain === TempleChainKind.EVM;

    const validateIndexOrDerivationPath = useCallback(
      (rawValue: string) => {
        if (rawValue.includes('/')) {
          return validateDerivationPath(rawValue);
        }

        const parsedIndex = parseInt(rawValue, 10);

        if (!Number.isInteger(parsedIndex) || parsedIndex < 0) {
          return t('invalidIndexError');
        }

        if (alreadyInWalletIndexes.includes(parsedIndex)) {
          return t('accountAlreadyImported');
        }

        if (alreadyInTmpListIndexes.includes(parsedIndex)) {
          return t('accountAlreadyListed');
        }

        return true;
      },
      [alreadyInTmpListIndexes, alreadyInWalletIndexes]
    );

    return (
      <ActionModal title={<T id="customPath" />} onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ActionModalBodyContainer>
            <Controller
              name="indexOrPath"
              control={control}
              rules={{
                required: t('required'),
                validate: validateIndexOrDerivationPath
              }}
              render={({ field }) => (
                <FormField
                  {...field}
                  label={
                    <>
                      <T id="indexOrDerivationPath" />
                      <Tooltip
                        content={
                          <span className="font-normal">
                            <T
                              id={isEvm ? 'evmIndexOrDerivationPathDescription' : 'indexOrDerivationPathDescription'}
                            />
                          </span>
                        }
                        size={16}
                        className="text-grey-3"
                        wrapperClassName="max-w-60"
                      />
                    </>
                  }
                  id="index-or-path-input"
                  type="text"
                  placeholder={isEvm ? t('evmIndexOrDerivationPathPlaceholder') : t('indexOrDerivationPathPlaceholder')}
                  errorCaption={errors.indexOrPath?.message}
                  reserveSpaceForError={false}
                  containerClassName="mb-1"
                  testID={ConnectLedgerModalSelectors.accountIndexInput}
                />
              )}
            />
          </ActionModalBodyContainer>
          <ActionModalButtonsContainer>
            <ActionModalButton
              color="primary"
              disabled={shouldDisableSubmitButton({ errors, formState, disableWhileSubmitting: false })}
              loading={formState.isSubmitting}
              type="submit"
              testID={ConnectLedgerModalSelectors.addCustomPathButton}
            >
              <T id="add" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </form>
      </ActionModal>
    );
  }
);
