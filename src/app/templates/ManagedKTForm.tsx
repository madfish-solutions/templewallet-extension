import React, { FC, ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { Alert, FormSubmitButton, NoSpaceField } from 'app/atoms';
import AccountTypeBadge from 'app/atoms/AccountTypeBadge';
import Identicon from 'app/atoms/Identicon';
import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';
import Balance from 'app/templates/Balance';
import CustomSelect, { OptionRenderProps } from 'app/templates/CustomSelect';
import { useFormAnalytics } from 'lib/analytics';
import { getOneUserContracts, TzktRelatedContract, isKnownChainId } from 'lib/apis/tzkt';
import { T, t } from 'lib/i18n';
import { useRetryableSWR } from 'lib/swr';
import { useRelevantAccounts, useTezos, useTempleClient, useChainId } from 'lib/temple/front';
import { isAddressValid } from 'lib/temple/helpers';
import { TempleAccountType, ImportAccountFormType } from 'lib/temple/types';

import { ImportAccountSelectors } from '../pages/ImportAccount/ImportAccount.selectors';

type ImportKTAccountFormData = {
  contractAddress: string;
};

const getContractAddress = (contract: TzktRelatedContract) => contract.address;

const ManagedKTForm: FC = () => {
  const accounts = useRelevantAccounts();
  const tezos = useTezos();
  const { importKTManagedAccount } = useTempleClient();
  const formAnalytics = useFormAnalytics(ImportAccountFormType.ManagedKT);
  const chainId = useChainId(true);

  const [error, setError] = useState<ReactNode>(null);

  const queryKey = useMemo(
    () =>
      [
        'get-accounts-contracts',
        chainId,
        ...accounts.filter(({ type }) => type !== TempleAccountType.ManagedKT).map(({ publicKeyHash }) => publicKeyHash)
      ] as string[],
    [accounts, chainId]
  );
  const { data: usersContracts = [] } = useRetryableSWR(queryKey, getUsersContracts, {});

  const remainingUsersContracts = useMemo(() => {
    return usersContracts.filter(({ address }) => !accounts.some(({ publicKeyHash }) => publicKeyHash === address));
  }, [accounts, usersContracts]);

  const { watch, handleSubmit, errors, control, formState, setValue, triggerValidation } =
    useForm<ImportKTAccountFormData>({
      mode: 'onChange',
      defaultValues: {}
    });

  const contractAddressFieldRef = useRef<HTMLTextAreaElement>(null);
  const handleContactAddressFocus = useCallback(() => contractAddressFieldRef?.current?.focus(), []);

  const validateContractAddress = useCallback(
    (value?: any) => {
      switch (false) {
        case value?.length > 0:
          return true;

        case isAddressValid(value):
          return t('invalidAddress');

        case value.startsWith('KT'):
          return t('notContractAddress');

        case accounts.every(({ publicKeyHash }) => publicKeyHash !== value):
          return t('contractAlreadyImported');

        default:
          return true;
      }
    },
    [accounts]
  );

  const contractAddress = watch('contractAddress');
  const cleanContractAddressField = useCallback(() => {
    setValue('contractAddress', '');
    triggerValidation('contractAddress');
  }, [setValue, triggerValidation]);

  const contractAddressFilled = useMemo(
    () => Boolean(contractAddress && isAddressValid(contractAddress)),
    [contractAddress]
  );

  const filledAccount = useMemo(
    () => (contractAddressFilled && remainingUsersContracts.find(a => a.address === contractAddress)) || null,
    [contractAddressFilled, remainingUsersContracts, contractAddress]
  );

  const onSubmit = useCallback(
    async ({ contractAddress: address }: ImportKTAccountFormData) => {
      if (formState.isSubmitting) {
        return;
      }

      formAnalytics.trackSubmit();
      setError(null);
      try {
        const contract = await tezos.contract.at(address);
        const owner = await contract.storage();
        if (typeof owner !== 'string') {
          throw new Error(t('invalidManagedContract'));
        }

        if (!accounts.some(({ publicKeyHash }) => publicKeyHash === owner)) {
          throw new Error(t('youAreNotContractManager'));
        }

        const chain = await tezos.rpc.getChainId();
        await importKTManagedAccount(address, chain, owner);

        formAnalytics.trackSubmitSuccess();
      } catch (err: any) {
        formAnalytics.trackSubmitFail();

        console.error(err);

        // Human delay
        await new Promise(r => setTimeout(r, 300));
        setError(err.message);
      }
    },
    [formState, tezos, accounts, importKTManagedAccount, formAnalytics]
  );

  const handleKnownContractSelect = useCallback(
    (address: string) => {
      setValue('contractAddress', address);
      triggerValidation('contractAddress');
    },
    [setValue, triggerValidation]
  );

  return (
    <form className="w-full max-w-sm mx-auto my-8" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert type="error" title="Error" description={error} autoFocus className="mb-6" />}

      <Controller
        name="contractAddress"
        as={<NoSpaceField ref={contractAddressFieldRef} />}
        control={control}
        rules={{
          required: true,
          validate: validateContractAddress
        }}
        onChange={([v]) => v}
        onFocus={handleContactAddressFocus}
        textarea
        rows={2}
        cleanable={Boolean(contractAddress)}
        onClean={cleanContractAddressField}
        id="contract-address"
        label={t('managedContract')}
        labelDescription={
          filledAccount ? (
            <div className="flex flex-wrap items-center">
              <Identicon
                type="bottts"
                hash={filledAccount.address}
                size={14}
                className="flex-shrink-0 shadow-xs opacity-75"
              />
              <div className="ml-1 mr-px font-normal">
                <T id="contract" />
              </div>{' '}
              <Balance assetSlug="tez" address={filledAccount.address}>
                {bal => (
                  <span className="text-xs leading-none">
                    <Money>{bal}</Money> <span style={{ fontSize: '0.75em' }}>ꜩ</span>
                  </span>
                )}
              </Balance>
            </div>
          ) : (
            t('contractAddressInputDescription')
          )
        }
        placeholder={t('contractAddressInputPlaceholder')}
        errorCaption={errors.contractAddress?.message}
        style={{
          resize: 'none'
        }}
        containerClassName="mb-4"
        testID={ImportAccountSelectors.managedContractInput}
      />

      <FormSubmitButton loading={formState.isSubmitting} testID={ImportAccountSelectors.managedKTImportButton}>
        <T id="importAccount" />
      </FormSubmitButton>

      {remainingUsersContracts.length > 0 && !contractAddressFilled && (
        <div className="mt-8 mb-6 flex flex-col">
          <h2 className="mb-4 leading-tight flex flex-col">
            <span className="text-base font-semibold text-gray-700">
              <T id="addKnownManagedContract" />
            </span>

            <span className="mt-1 text-xs font-light text-gray-600 max-w-9/10">
              <T id="clickOnContractToImport" />
            </span>
          </h2>

          <CustomSelect
            getItemId={getContractAddress}
            items={remainingUsersContracts}
            maxHeight="11rem"
            onSelect={handleKnownContractSelect}
            OptionIcon={ContractIcon}
            OptionContent={ContractOptionContent}
          />
        </div>
      )}
    </form>
  );
};

export default ManagedKTForm;

const getUsersContracts = async (_k: string, chainId: string, ...accounts: string[]) => {
  if (!isKnownChainId(chainId)) {
    return [];
  }

  const contractsChunks = await Promise.all(
    accounts.map<Promise<TzktRelatedContract[]>>(account => getOneUserContracts(chainId, account).catch(() => []))
  );
  return contractsChunks.reduce(
    (contracts, chunk) => [...contracts, ...chunk.filter(({ kind }) => kind === 'delegator_contract')],
    []
  );
};

type ContractOptionRenderProps = OptionRenderProps<TzktRelatedContract, string>;

const ContractIcon: FC<ContractOptionRenderProps> = props => {
  return <Identicon type="bottts" hash={props.item.address} size={32} className="flex-shrink-0 shadow-xs" />;
};

const ContractOptionContent: FC<ContractOptionRenderProps> = props => {
  const { item } = props;

  return (
    <>
      <div className="flex flex-wrap items-center">
        <Name className="text-sm font-medium leading-tight">
          <T id="contract" />
        </Name>

        <AccountTypeBadge account={{ type: TempleAccountType.ManagedKT }} />
      </div>

      <div className="flex flex-wrap items-center mt-1">
        <div className="text-xs leading-none text-gray-700">
          {(() => {
            const val = item.address;
            const ln = val.length;
            return (
              <>
                {val.slice(0, 7)}
                <span className="opacity-75">...</span>
                {val.slice(ln - 4, ln)}
              </>
            );
          })()}
        </div>

        <Balance assetSlug="tez" address={item.address}>
          {bal => (
            <div className="ml-2 text-xs leading-none text-gray-600">
              <Money>{bal}</Money> <span style={{ fontSize: '0.75em' }}>tez</span>
            </div>
          )}
        </Balance>
      </div>
    </>
  );
};
