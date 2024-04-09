import React, { FC, memo, ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { Alert, FormSubmitButton, NoSpaceField, Identicon, Name, Money, AccountTypeBadge } from 'app/atoms';
import { ContentContainer } from 'app/layouts/ContentContainer';
import Balance from 'app/templates/Balance';
import { useChainSelectController, ChainSelectSection } from 'app/templates/ChainSelect';
import CustomSelect, { OptionRenderProps } from 'app/templates/CustomSelect';
import { useFormAnalytics } from 'lib/analytics';
import { getOneUserContracts, TzktRelatedContract, isKnownChainId } from 'lib/apis/tzkt';
import { TEZOS_SYMBOL } from 'lib/assets';
import { T, t } from 'lib/i18n';
import { useRetryableSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { isValidTezosAddress } from 'lib/tezos';
import { isTruthy } from 'lib/utils';
import { getAccountForTezos } from 'temple/accounts';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { useRelevantAccounts } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';
import { getReadOnlyTezos } from 'temple/tezos';

import { ImportAccountSelectors, ImportAccountFormType } from './selectors';

type ImportKTAccountFormData = {
  contractAddress: string;
};

const getContractAddress = (contract: TzktRelatedContract) => contract.address;

export const ManagedKTForm = memo(() => {
  const chainSelectController = useChainSelectController();
  const network = chainSelectController.value;

  return (
    <ContentContainer className="w-full max-w-sm mx-auto my-8">
      <ChainSelectSection controller={chainSelectController} />

      {network.chain === 'tezos' ? (
        <ManagedKTFormContent network={network} />
      ) : (
        <div className="text-center">{UNDER_DEVELOPMENT_MSG}</div>
      )}
    </ContentContainer>
  );
});

const ManagedKTFormContent: FC<{ network: TezosNetworkEssentials }> = ({ network }) => {
  const { importKTManagedAccount } = useTempleClient();

  const { chainId, rpcBaseURL } = network;

  const relevantAccounts = useRelevantAccounts(chainId);
  const tezosAccounts = useMemo(
    () => relevantAccounts.map(acc => getAccountForTezos(acc)).filter(isTruthy),
    [relevantAccounts]
  );

  const formAnalytics = useFormAnalytics(ImportAccountFormType.ManagedKT);

  const [error, setError] = useState<ReactNode>(null);

  const queryKey = useMemo(
    () => [
      'get-accounts-contracts',
      chainId,
      ...tezosAccounts.filter(({ type }) => type !== TempleAccountType.ManagedKT).map(acc => acc.address)
    ],
    [tezosAccounts, chainId]
  );
  const { data: usersContracts = [] } = useRetryableSWR(queryKey, getUsersContracts, {});

  const remainingUsersContracts = useMemo(() => {
    return usersContracts.filter(({ address }) => !tezosAccounts.some(acc => acc.address === address));
  }, [tezosAccounts, usersContracts]);

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

        case isValidTezosAddress(value):
          return t('invalidAddress');

        case value.startsWith('KT'):
          return t('notContractAddress');

        case tezosAccounts.every(acc => acc.address !== value):
          return t('contractAlreadyImported');

        default:
          return true;
      }
    },
    [tezosAccounts]
  );

  const contractAddress = watch('contractAddress');
  const cleanContractAddressField = useCallback(() => {
    setValue('contractAddress', '');
    triggerValidation('contractAddress');
  }, [setValue, triggerValidation]);

  const contractAddressFilled = useMemo(
    () => Boolean(contractAddress && isValidTezosAddress(contractAddress)),
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
        const tezos = getReadOnlyTezos(rpcBaseURL);

        const contract = await tezos.contract.at(address);
        const owner = await contract.storage();
        if (typeof owner !== 'string') {
          throw new Error(t('invalidManagedContract'));
        }

        if (!tezosAccounts.some(acc => acc.address === owner)) {
          throw new Error(t('youAreNotContractManager'));
        }

        const chainId = await tezos.rpc.getChainId();
        await importKTManagedAccount(address, chainId, owner);

        formAnalytics.trackSubmitSuccess();
      } catch (err: any) {
        console.error(err);

        formAnalytics.trackSubmitFail();

        setError(err.message);
      }
    },
    [formState, rpcBaseURL, tezosAccounts, importKTManagedAccount, formAnalytics]
  );

  const handleKnownContractSelect = useCallback(
    (address: string) => {
      setValue('contractAddress', address);
      triggerValidation('contractAddress');
    },
    [setValue, triggerValidation]
  );

  return (
    <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
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
              <Balance network={network} assetSlug="tez" address={filledAccount.address}>
                {bal => (
                  <span className="text-xs leading-none">
                    <Money>{bal}</Money> <span style={{ fontSize: '0.75em' }}>{TEZOS_SYMBOL}</span>
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
            OptionContent={props => <ContractOptionContent {...props} network={network} />}
          />
        </div>
      )}
    </form>
  );
};

const getUsersContracts = async ([, chainId, ...accounts]: string[]) => {
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

interface ContractOptionRenderProps extends OptionRenderProps<TzktRelatedContract, string> {
  network: TezosNetworkEssentials;
}

const ContractIcon: FC<OptionRenderProps<TzktRelatedContract, string>> = props => {
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

        <AccountTypeBadge accountType={TempleAccountType.ManagedKT} />
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

        <Balance network={props.network} assetSlug="tez" address={item.address}>
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
