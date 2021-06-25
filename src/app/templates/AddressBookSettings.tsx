import React, { useCallback, useMemo } from "react";

import classNames from "clsx";
import { useForm } from "react-hook-form";

import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Identicon from "app/atoms/Identicon";
import Name from "app/atoms/Name";
import SubTitle from "app/atoms/SubTitle";
import { ReactComponent as CloseIcon } from "app/icons/close.svg";
import { t, T } from "lib/i18n/react";
import {
  useContacts,
  TempleContact,
  isDomainNameValid,
  useTezosDomainsClient,
  isAddressValid,
} from "lib/temple/front";
import { useConfirm } from "lib/ui/dialog";
import { withErrorHumanDelay } from "lib/ui/humanDelay";

import CustomSelect, { OptionRenderProps } from "./CustomSelect";
import HashChip from "./HashChip";

type ContactActions = {
  remove: (address: string) => void;
};

const AddressBook: React.FC = () => {
  const { contacts, removeContact } = useContacts();
  const confirm = useConfirm();

  const handleRemoveContactClick = useCallback(
    async (address: string) => {
      if (
        !(await confirm({
          title: t("actionConfirmation"),
          children: t("deleteContactConfirm"),
        }))
      ) {
        return;
      }

      removeContact(address);
    },
    [confirm, removeContact]
  );

  const contactActions = useMemo<ContactActions>(
    () => ({
      remove: handleRemoveContactClick,
    }),
    [handleRemoveContactClick]
  );

  return (
    <div className="w-full max-w-sm p-2 pb-4 mx-auto">
      <SubTitle className="mb-4">
        <T id="addNewContact" />
      </SubTitle>

      <AddNewContactForm className="mb-8" />

      <div className="mb-4">
        <span className="text-base font-semibold text-gray-700">
          <T id="currentContacts" />
        </span>
      </div>

      <CustomSelect
        actions={contactActions}
        className="mb-6"
        getItemId={getContactKey}
        items={contacts}
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

const SUBMIT_ERROR_TYPE = "submit-error";

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
    errors,
  } = useForm<ContactFormData>();
  const submitting = formState.isSubmitting;

  const onAddContactSubmit = useCallback(
    async (data: ContactFormData) => {
      if (submitting) return;

      try {
        clearError();
        await addContact({ ...data, addedAt: Date.now() });
        resetForm();
      } catch (err) {
        await withErrorHumanDelay(err, () =>
          setError("address", SUBMIT_ERROR_TYPE, err.message)
        );
      }
    },
    [submitting, clearError, addContact, resetForm, setError]
  );

  const validateAddressField = useCallback(
    async (value: any) => {
      if (!value?.length || value.length < 0) {
        return t("Required");
      }

      if (isDomainNameValid(value, domainsClient)) {
        const resolved = await domainsClient.resolver.resolveNameToAddress(
          value
        );
        if (!resolved) {
          return t("domainDoesntResolveToAddress", value);
        }

        value = resolved;
      }

      return isAddressValid(value) ? true : t("invalidAddressOrDomain");
    },
    [domainsClient]
  );

  return (
    <form className={className} onSubmit={handleSubmit(onAddContactSubmit)}>
      <FormField
        ref={register({ validate: validateAddressField })}
        label={t("address")}
        id="address"
        name="address"
        placeholder={t("recipientInputPlaceholderWithDomain")}
        errorCaption={errors.address?.message}
        containerClassName="mb-4"
      />

      <FormField
        ref={register({
          required: t("required"),
          maxLength: { value: 50, message: t("maximalAmount", "50") },
        })}
        label={t("name")}
        id="name"
        name="name"
        placeholder={t("newContactPlaceholder")}
        errorCaption={errors.name?.message}
        containerClassName="mb-6"
        maxLength={50}
      />

      <FormSubmitButton loading={submitting}>
        <T id="addContact" />
      </FormSubmitButton>
    </form>
  );
};

const ContactIcon: React.FC<
  OptionRenderProps<TempleContact, string, ContactActions>
> = ({ item }) => (
  <Identicon
    type="bottts"
    hash={item.address}
    size={32}
    className="flex-shrink-0 shadow-xs"
  />
);

const ContactContent: React.FC<
  OptionRenderProps<TempleContact, string, ContactActions>
> = ({ item, actions }) => (
  <div className="flex flex-1 w-full">
    <div className="flex flex-col justify-between flex-1">
      <Name className="mb-px text-sm font-medium leading-tight text-left">
        {item.name}
      </Name>

      <div className="text-xs font-light leading-tight text-gray-600">
        <HashChip hash={item.address} small />
      </div>
    </div>

    <button
      className={classNames(
        "flex-none p-2",
        "text-gray-500 hover:text-gray-600",
        "transition ease-in-out duration-200"
      )}
      onClick={(evt) => {
        evt.stopPropagation();
        actions?.remove(item.address);
      }}
    >
      <CloseIcon
        className="w-auto h-5 stroke-current stroke-2"
        title={t("delete")}
      />
    </button>
  </div>
);

function getContactKey(contract: TempleContact) {
  return contract.address;
}
