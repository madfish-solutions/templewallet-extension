import React, { memo, useCallback, useEffect } from 'react';

import { isEmpty } from 'lodash';
import { Controller, useForm } from 'react-hook-form';
import { isAddress } from 'viem';

import { FormField, IconBase, NoSpaceField } from 'app/atoms';
import { CLOSE_ANIMATION_TIMEOUT, PageModal } from 'app/atoms/PageModal';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as DeleteIcon } from 'app/icons/base/delete.svg';
import { toastSuccess } from 'app/toaster';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useContactsActions } from 'lib/temple/front';
import { TempleContact } from 'lib/temple/types';
import { isValidTezosAddress } from 'lib/tezos';
import { useBooleanState } from 'lib/ui/hooks';
import { readClipboard } from 'lib/ui/utils';
import { delay } from 'lib/utils';

import { isEvmContact } from '../utils';

import { DeleteContactModal } from './DeleteContact';

interface FormData {
  name: string;
  address: string;
}

const defaultValues: FormData = {
  name: '',
  address: ''
};

const SUBMIT_ERROR_TYPE = 'submit-error';
const MAX_NAME_LENGTH = 20;

interface Props {
  contact: TempleContact | null;
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const EditAddContact = memo<Props>(({ contact, opened, onRequestClose }) => {
  const formAnalytics = useFormAnalytics(contact ? 'EditContactForm' : 'AddContactForm');

  const [deleteModalOpened, setDeleteModalOpened, setDeleteModalClosed] = useBooleanState(false);

  const { addContact, editContact } = useContactsActions();

  const { watch, handleSubmit, control, setValue, setError, clearErrors, reset, formState } = useForm<FormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues
  });
  const { isSubmitting, submitCount, errors } = formState;

  const formSubmitted = submitCount > 0;

  const nameValue = watch('name');
  const addressValue = watch('address');

  useEffect(() => {
    if (contact) {
      setValue('name', contact.name);
      setValue('address', contact.address);
    }
  }, [contact, setValue]);

  const onClose = useCallback(() => {
    onRequestClose();
    reset(defaultValues);
  }, [onRequestClose, reset]);

  const handleNameClean = useCallback(
    () => setValue('name', '', { shouldValidate: formSubmitted }),
    [setValue, formSubmitted]
  );

  const handleAddressClean = useCallback(
    () => setValue('address', '', { shouldValidate: formSubmitted }),
    [setValue, formSubmitted]
  );

  const handlePasteButtonClick = useCallback(() => {
    readClipboard()
      .then(value => setValue('address', value, { shouldValidate: formSubmitted }))
      .catch(console.error);
  }, [formSubmitted, setValue]);

  const validateAddress = useCallback((value: string) => {
    if (!value) return t('required');

    let isValidAddress: boolean;

    if (isEvmContact(value)) {
      isValidAddress = isAddress(value);
    } else {
      isValidAddress = isValidTezosAddress(value);
    }

    return isValidAddress || t('invalidAddress');
  }, []);

  const handleDeleteClick = useCallback(() => {
    setDeleteModalClosed();
    onClose();
    setTimeout(() => toastSuccess('Contact Deleted', true), CLOSE_ANIMATION_TIMEOUT * 2);
  }, [onClose, setDeleteModalClosed]);

  const onSubmit = useCallback(
    async ({ name, address }: FormData) => {
      if (formState.isSubmitting) return;
      formAnalytics.trackSubmit();

      try {
        clearErrors();

        if (contact) {
          await editContact(contact.address, { address, name });
        } else {
          await addContact({ address, name, addedAt: Date.now() });
        }

        onClose();

        formAnalytics.trackSubmitSuccess();
        setTimeout(() => toastSuccess(`Contact ${contact ? 'Edited' : 'Added'}`, true), CLOSE_ANIMATION_TIMEOUT * 2);
      } catch (err: any) {
        console.error(err);

        await delay();

        setError('address', { type: SUBMIT_ERROR_TYPE, message: err.message });
        formAnalytics.trackSubmitFail();
      }
    },
    [addContact, clearErrors, editContact, formAnalytics, formState.isSubmitting, contact, onClose, setError]
  );

  return (
    <PageModal title={contact ? `Edit ${contact.name}` : t('addContact')} opened={opened} onRequestClose={onClose}>
      <form
        id="add-contact-form"
        className="flex-1 pt-4 px-4 flex flex-col overflow-y-auto"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Controller
          name="name"
          control={control}
          rules={{
            required: t('required'),
            maxLength: { value: MAX_NAME_LENGTH, message: `Maximum ${MAX_NAME_LENGTH} characters` }
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <FormField
              value={value}
              onBlur={onBlur}
              onChange={v => onChange(v ?? '')}
              cleanable={Boolean(nameValue)}
              onClean={handleNameClean}
              label={t('name')}
              placeholder="e.g Degen"
              errorCaption={formSubmitted ? errors.name?.message : null}
              containerClassName="pb-4"
            />
          )}
        />

        <Controller
          name="address"
          control={control}
          rules={{ validate: validateAddress }}
          render={({ field }) => (
            <NoSpaceField
              {...field}
              extraRightInnerWrapper="unset"
              textarea
              showPasteButton
              rows={3}
              cleanable={Boolean(addressValue)}
              onClean={handleAddressClean}
              onPasteButtonClick={handlePasteButtonClick}
              label={t('address')}
              placeholder="EVM or Tezos"
              errorCaption={formSubmitted ? errors.address?.message : null}
              containerClassName="pb-4"
              style={{ resize: 'none' }}
            />
          )}
        />

        {contact && (
          <>
            <div className="flex justify-center">
              <StyledButton
                size="S"
                color="red-low"
                className="bg-transparent! flex items-center px-0! py-1 gap-0.5"
                onClick={setDeleteModalOpened}
              >
                <T id="delete" />

                <IconBase size={12} Icon={DeleteIcon} />
              </StyledButton>
            </div>
            {deleteModalOpened && (
              <DeleteContactModal contact={contact} onClose={setDeleteModalClosed} onDelete={handleDeleteClick} />
            )}
          </>
        )}
      </form>

      <ActionsButtonsBox bgSet={false}>
        <StyledButton
          form="add-contact-form"
          type="submit"
          size="L"
          color="primary"
          loading={isSubmitting}
          disabled={formSubmitted && !isEmpty(errors)}
        >
          <T id="save" />
        </StyledButton>
      </ActionsButtonsBox>
    </PageModal>
  );
});
