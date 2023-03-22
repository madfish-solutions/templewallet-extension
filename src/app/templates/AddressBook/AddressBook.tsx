import React, { useCallback, useMemo } from 'react';

import classNames from 'clsx';
import { useForm } from 'react-hook-form';

import { FormField, FormSubmitButton } from 'app/atoms';
import Identicon from 'app/atoms/Identicon';
import Name from 'app/atoms/Name';
import SubTitle from 'app/atoms/SubTitle';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { t, T } from 'lib/i18n';
import { isDomainNameValid, useTezosDomainsClient, useContacts, useFilteredContacts } from 'lib/temple/front';
import { isAddressValid } from 'lib/temple/helpers';
import { TempleContact } from 'lib/temple/types';
import { useConfirm } from 'lib/ui/dialog';
import { withErrorHumanDelay } from 'lib/ui/humanDelay';

import CustomSelect, { OptionRenderProps } from '../CustomSelect';
import HashChip from '../HashChip';
// eslint-disable-next-line import/namespace
import { AddressBookSelectors } from './AddressBook.selectors';

type ContactActions = {
  remove: (address: string) => void;
};

const AddressBook: React.FC = () => {
  const { removeContact } = useContacts();
  const { allContacts } = useFilteredContacts();
  const confirm = useConfirm();

  const handleRemoveContactClick = useCallback(
    async (address: string) => {
      if (
        !(await confirm({
          title: t('actionConfirmation'),
          children: t('deleteContactConfirm')
        }))
      ) {
        return;
      }

      await removeContact(address);
    },
    [confirm, removeContact]
  );

  const contactActions = useMemo<ContactActions>(
    () => ({
      remove: handleRemoveContactClick
    }),
    [handleRemoveContactClick]
  );

  return (
    <div className="w-full max-w-sm p-2 pb-4 mx-auto">
      <SubTitle className="mb-4">
        <T id="addNewContact" />
      </SubTitle>

      <AddNewContactForm className="mb-8" />

      <div className="mb-4 flex flex-col">
        <span className="text-base font-semibold text-gray-700">
          <T id="currentContacts" />
        </span>

        <span className="mt-1 text-xs font-light text-gray-600max-w-9/10">
          <T id="updateContactDescription" />
        </span>
      </div>

      <CustomSelect
        actions={contactActions}
        className="mb-6"
        getItemId={getContactKey}
        items={allContacts}
        OptionIcon={ContactIcon}
        OptionContent={ContactContent}
        light
        hoverable={false}
      />
    </div>
  );
};

export default AddressBook;

type ContactFormData = {
  address: string;
  name: string;
};

const SUBMIT_ERROR_TYPE = 'submit-error';

const AddNewContactForm: React.FC<{ className?: string }> = ({ className }) => {
  const { addContact } = useContacts();
  const domainsClient = useTezosDomainsClient();

  const {
    register,
    reset: resetForm,
    handleSubmit,
    formState,
    clearError,
    setError,
    errors
  } = useForm<ContactFormData>();
  const submitting = formState.isSubmitting;

  const onAddContactSubmit = useCallback(
    async ({ address, name }: ContactFormData) => {
      if (submitting) return;

      try {
        clearError();

        if (isDomainNameValid(address, domainsClient)) {
          const resolved = await domainsClient.resolver.resolveNameToAddress(address);
          if (!resolved) {
            throw new Error(t('domainDoesntResolveToAddress', address));
          }

          address = resolved;
        }

        if (!isAddressValid(address)) {
          throw new Error(t('invalidAddressOrDomain'));
        }

        await addContact({ address, name, addedAt: Date.now() });
        resetForm();
      } catch (err: any) {
        await withErrorHumanDelay(err, () => setError('address', SUBMIT_ERROR_TYPE, err.message));
      }
    },
    [submitting, clearError, addContact, resetForm, setError, domainsClient]
  );

  const validateAddressField = useCallback(
    async (value: any) => {
      if (!value?.length) {
        return t('required');
      }

      if (isDomainNameValid(value, domainsClient)) {
        const resolved = await domainsClient.resolver.resolveNameToAddress(value);
        if (!resolved) {
          return t('domainDoesntResolveToAddress', value);
        }

        value = resolved;
      }

      return isAddressValid(value) ? true : t('invalidAddressOrDomain');
    },
    [domainsClient]
  );

  return (
    <form className={className} onSubmit={handleSubmit(onAddContactSubmit)}>
      <FormField
        ref={register({ validate: validateAddressField })}
        label={t('address')}
        id="address"
        name="address"
        placeholder={t('recipientInputPlaceholderWithDomain')}
        errorCaption={errors.address?.message}
        containerClassName="mb-4"
        testID={AddressBookSelectors.addressInput}
      />

      <FormField
        ref={register({
          required: t('required'),
          maxLength: { value: 50, message: t('maximalAmount', '50') }
        })}
        label={t('name')}
        id="name"
        name="name"
        placeholder={t('newContactPlaceholder')}
        errorCaption={errors.name?.message}
        containerClassName="mb-6"
        maxLength={50}
        testID={AddressBookSelectors.nameInput}
      />

      <FormSubmitButton loading={submitting} testID={AddressBookSelectors.addContactButton}>
        <T id="addContact" />
      </FormSubmitButton>
    </form>
  );
};

const ContactIcon: React.FC<OptionRenderProps<TempleContact, string, ContactActions>> = ({ item }) => (
  <Identicon type="bottts" hash={item.address} size={32} className="flex-shrink-0 shadow-xs" />
);

const ContactContent: React.FC<OptionRenderProps<TempleContact, string, ContactActions>> = ({ item, actions }) => (
  <div className="flex flex-1 w-full">
    <div className="flex flex-col justify-between flex-1">
      <Name className="mb-px text-sm font-medium leading-tight text-left">{item.name}</Name>

      <div className="text-xs font-light leading-tight text-gray-600">
        <HashChip hash={item.address} small />
      </div>
    </div>

    {item.accountInWallet ? (
      <div className="flex items-center">
        <span
          className={classNames(
            'mx-1 px-1 py-px leading-tight text-opacity-50',
            'rounded-sm border border-opacity-25 border-black text-black'
          )}
          style={{ fontSize: '0.6rem' }}
        >
          <T id="ownAccount" />
        </span>
      </div>
    ) : (
      <button
        className="flex-none p-2 text-gray-500 hover:text-gray-600 transition ease-in-out duration-200"
        onClick={evt => {
          evt.stopPropagation();
          actions?.remove(item.address);
        }}
      >
        <CloseIcon className="w-auto h-5 stroke-current stroke-2" title={t('delete')} />
      </button>
    )}
  </div>
);

function getContactKey(contract: TempleContact) {
  return contract.address;
}
