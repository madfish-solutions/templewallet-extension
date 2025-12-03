import React, { memo, useCallback, useEffect, useMemo, useState, ReactNode } from 'react';

import { isDefined } from '@rnw-community/shared';
import { DerivationType } from '@taquito/ledger-signer';
import { nanoid } from 'nanoid';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Button, HashShortView, IconBase, Money } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { StyledButton } from 'app/atoms/StyledButton';
import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { AccountCard } from 'app/templates/account-card';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { toastError } from 'app/toaster';
import { T, t } from 'lib/i18n';
import { TEZOS_METADATA } from 'lib/metadata';
import { useTempleClient, validateDerivationPath } from 'lib/temple/front';
import { fetchNewAccountName, getDerivationPath } from 'lib/temple/helpers';
import { StoredAccount, TempleAccountType } from 'lib/temple/types';
import { LedgerOperationState, runConnectedLedgerOperationFlow } from 'lib/ui';
import { useBooleanState } from 'lib/ui/hooks';
import { useCopyText } from 'lib/ui/hooks/use-copy-text';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { DEFAULT_EVM_CURRENCY } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { ConnectLedgerModalSelectors } from '../selectors';
import { AccountProps, LedgerConnectionConfig } from '../types';
import { useGetLedgerEvmAccount, useGetLedgerTezosAccount } from '../utils';

import { CustomPathFormData, CustomPathModal } from './custom-path-modal';
import { DerivationTypeSelector } from './derivation-type-selector';

type RecognizedTezosGroupKey = 'standard' | 'galleon';

interface GroupedLedgerAccount {
  account: AccountProps;
  listIndex: number;
}

interface LedgerAccountsGroups {
  standard: GroupedLedgerAccount[];
  galleon: GroupedLedgerAccount[];
  other: GroupedLedgerAccount[];
}

const STANDARD_TEZOS_DERIVATION_REGEX = /^m\/44'\/1729'\/\d+'\/0'$/;
const GALLEON_DERIVATION_REGEX = /^m\/44'\/1729'\/\d+'\/0'\/0'\/\d+'?$/;

const TEZOS_DERIVATION_GROUPS_METADATA: Record<
  RecognizedTezosGroupKey,
  { title: string; patternLabel: string | null }
> = {
  standard: {
    title: 'Default',
    patternLabel: null
  },
  galleon: {
    title: 'Custom',
    patternLabel: "m/44'/1729'/0'/0'/0'"
  }
};

const TEZOS_GROUPS_RENDER_ORDER: RecognizedTezosGroupKey[] = ['standard', 'galleon'];

const isDefaultTezosDerivationPath = (account: AccountProps) => {
  if (account.chain !== TempleChainKind.Tezos) {
    return false;
  }

  if (isDefined(account.index)) {
    return account.derivationPath === getDerivationPath(TempleChainKind.Tezos, account.index);
  }

  return STANDARD_TEZOS_DERIVATION_REGEX.test(account.derivationPath);
};

const createEmptyLedgerAccountsGroups = (): LedgerAccountsGroups => ({
  standard: [],
  galleon: [],
  other: []
});

interface SelectAccountStepProps {
  initialAccount: AccountProps;
  selection: LedgerConnectionConfig;
  onSuccess: EmptyFn;
}

export const SelectAccountStep = memo<SelectAccountStepProps>(({ initialAccount, selection, onSuccess }) => {
  const { accounts, createLedgerAccount } = useTempleClient();
  const pickTezosAccounts = initialAccount.chain === TempleChainKind.Tezos;
  const defaultDerivationType = pickTezosAccounts
    ? selection.tezosSettings?.derivationType ?? initialAccount.derivationType
    : DerivationType.ED25519;

  const [knownAccountsByDerivation, setKnownAccountsByDerivation] = useState<Record<DerivationType, AccountProps[]>>(
    () => {
      const initialState: Record<DerivationType, AccountProps[]> = {
        [DerivationType.ED25519]: [],
        [DerivationType.SECP256K1]: [],
        [DerivationType.P256]: [],
        [DerivationType.BIP32_ED25519]: []
      };

      const initialBucket = pickTezosAccounts ? initialAccount.derivationType : DerivationType.ED25519;
      initialState[initialBucket] = [initialAccount];

      return initialState;
    }
  );
  const [activeAccountsIndexes, setActiveAccountsIndexes] = useState<Record<DerivationType, number>>({
    [DerivationType.ED25519]: defaultDerivationType === DerivationType.ED25519 ? 0 : -1,
    [DerivationType.SECP256K1]: defaultDerivationType === DerivationType.SECP256K1 ? 0 : -1,
    [DerivationType.P256]: defaultDerivationType === DerivationType.P256 ? 0 : -1,
    [DerivationType.BIP32_ED25519]: defaultDerivationType === DerivationType.BIP32_ED25519 ? 0 : -1
  });
  const [isSwitchingDerivation, setIsSwitchingDerivation] = useState(false);
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [derivationType, setDerivationType] = useState<DerivationType>(defaultDerivationType);
  const [customPathModalIsOpen, openCustomPathModal, closeCustomPathModal] = useBooleanState(false);
  const knownLedgerAccounts = knownAccountsByDerivation[derivationType];
  const activeAccountIndex = activeAccountsIndexes[derivationType];

  const ledgerAccountsGroups = useMemo<LedgerAccountsGroups>(() => {
    if (!pickTezosAccounts) {
      return createEmptyLedgerAccountsGroups();
    }

    const groups = createEmptyLedgerAccountsGroups();

    knownLedgerAccounts.forEach((account, listIndex) => {
      const bucket = { account, listIndex };

      if (isDefaultTezosDerivationPath(account)) {
        groups.standard.push(bucket);
        return;
      }

      if (GALLEON_DERIVATION_REGEX.test(account.derivationPath)) {
        groups.galleon.push(bucket);
        return;
      }

      groups.other.push(bucket);
    });

    return groups;
  }, [knownLedgerAccounts, pickTezosAccounts]);
  const { other: tezosOtherAccounts } = ledgerAccountsGroups;

  const {
    ledgerApprovalModalState,
    setLedgerApprovalModalState,
    handleLedgerModalClose: handleApproveModalClose
  } = useLedgerApprovalModalState();
  const approveModalVisible = ledgerApprovalModalState !== LedgerOperationState.NotStarted;
  const getLedgerTezosAccount = useGetLedgerTezosAccount();
  const getLedgerEvmAccount = useGetLedgerEvmAccount();
  const alreadyInTmpListIndexes = useMemo(
    () => knownLedgerAccounts.map(a => a.index).filter(isDefined),
    [knownLedgerAccounts]
  );

  const submitSelectedAccount = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const account = knownLedgerAccounts[activeAccountIndex];
      const { chain, derivationPath, address, publicKey } = account;
      await createLedgerAccount({
        chain,
        derivationPath,
        address,
        publicKey,
        derivationType: 'derivationType' in account ? account.derivationType : undefined,
        name: await fetchNewAccountName(accounts, TempleAccountType.Ledger, i => t('defaultLedgerName', String(i)))
      });
      onSuccess();
    } catch (e: any) {
      toastError(e.message ?? t('unknownError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [accounts, activeAccountIndex, createLedgerAccount, knownLedgerAccounts, onSuccess]);

  const importLedgerAccount = useCallback(
    (currentDerivationType: DerivationType, indexOrPath?: string | number) =>
      runConnectedLedgerOperationFlow(
        async () => {
          const newAccount = pickTezosAccounts
            ? await getLedgerTezosAccount(currentDerivationType, indexOrPath)
            : await getLedgerEvmAccount(indexOrPath);
          setKnownAccountsByDerivation(prevAccounts => ({
            ...prevAccounts,
            [currentDerivationType]: prevAccounts[currentDerivationType].concat(newAccount)
          }));
          setActiveAccountsIndexes(prevIndexes => ({
            ...prevIndexes,
            [currentDerivationType]: prevIndexes[currentDerivationType] + 1
          }));
        },
        pickTezosAccounts ? setLedgerApprovalModalState : undefined,
        !pickTezosAccounts
      ).catch(e => {
        console.error(e);
        toastError(t('unableToConnectDescription'));
      }),
    [getLedgerEvmAccount, getLedgerTezosAccount, pickTezosAccounts, setLedgerApprovalModalState]
  );

  const handleDerivationTypeSelect = useCallback(
    async (newDerivationType: DerivationType) => {
      setDerivationType(newDerivationType);

      if (knownAccountsByDerivation[newDerivationType].length > 0) {
        return;
      }

      setIsSwitchingDerivation(true);
      await importLedgerAccount(newDerivationType);
    },
    [importLedgerAccount, knownAccountsByDerivation]
  );
  useEffect(() => {
    if (!approveModalVisible) {
      setIsSwitchingDerivation(false);
    }
  }, [approveModalVisible]);

  const handleCustomPathModalSubmit = useCallback(
    async ({ indexOrPath }: CustomPathFormData) => {
      if (pickTezosAccounts) {
        closeCustomPathModal();
      }
      await importLedgerAccount(
        derivationType,
        validateDerivationPath(indexOrPath) === true ? indexOrPath : Number(indexOrPath)
      );
      if (!pickTezosAccounts) {
        closeCustomPathModal();
      }
    },
    [closeCustomPathModal, derivationType, importLedgerAccount, pickTezosAccounts]
  );

  const handleAccountSelect = useCallback(
    (accountIndex: number) => {
      setActiveAccountsIndexes(prevIndexes => ({ ...prevIndexes, [derivationType]: accountIndex }));
    },
    [derivationType]
  );

  return (
    <FadeTransition>
      <LedgerApprovalModal
        state={ledgerApprovalModalState}
        isSwitchingDerivation={isSwitchingDerivation}
        onClose={handleApproveModalClose}
        chainKind={initialAccount.chain}
      />

      {customPathModalIsOpen && (
        <CustomPathModal
          chain={initialAccount.chain}
          alreadyInTmpListIndexes={alreadyInTmpListIndexes}
          onClose={closeCustomPathModal}
          onSubmit={handleCustomPathModalSubmit}
        />
      )}

      <ScrollView className="pt-4 gap-2" onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}>
        <>
          {pickTezosAccounts && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-font-description-bold m-1">
                  <T id="derivationType" />
                </span>
                <StyledButton
                  color="secondary-low"
                  className="bg-transparent"
                  size="S"
                  testID={ConnectLedgerModalSelectors.customPathButton}
                  onClick={openCustomPathModal}
                >
                  <T id="customPath" />
                </StyledButton>
              </div>

              <DerivationTypeSelector onSelect={handleDerivationTypeSelect} derivationType={derivationType} />
            </div>
          )}

          {pickTezosAccounts ? (
            <div className="flex flex-col mt-4">
              {TEZOS_GROUPS_RENDER_ORDER.map(groupKey => {
                const accounts = ledgerAccountsGroups[groupKey];

                if (accounts.length === 0) {
                  return null;
                }

                const { title, patternLabel } = TEZOS_DERIVATION_GROUPS_METADATA[groupKey];

                return (
                  <LedgerAccountsSection
                    key={groupKey}
                    title={title}
                    subtitle={patternLabel}
                    accounts={accounts}
                    onSelect={handleAccountSelect}
                    activeAccountIndex={activeAccountIndex}
                  />
                );
              })}

              {tezosOtherAccounts.length > 0 && (
                <LedgerAccountsSection
                  key="other"
                  title={<T id="other" />}
                  accounts={tezosOtherAccounts}
                  onSelect={handleAccountSelect}
                  activeAccountIndex={activeAccountIndex}
                />
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-row justify-between gap-2">
                <span className="text-font-description-bold m-1">Ledger Live</span>
                <StyledButton
                  color="secondary-low"
                  className="bg-transparent"
                  size="S"
                  testID={ConnectLedgerModalSelectors.customPathButton}
                  onClick={openCustomPathModal}
                >
                  <T id="customPath" />
                </StyledButton>
              </div>
              <div className="flex flex-col gap-3">
                {knownLedgerAccounts.map((account, index) => (
                  <LedgerAccountCard
                    key={account.address}
                    account={account}
                    index={index}
                    onSelect={handleAccountSelect}
                    active={index === activeAccountIndex}
                  />
                ))}
              </div>
            </>
          )}
        </>
      </ScrollView>

      <ActionsButtonsBox shouldCastShadow={!bottomEdgeIsVisible}>
        <StyledButton
          size="L"
          className="w-full"
          color="primary"
          disabled={approveModalVisible}
          loading={isSubmitting}
          onClick={submitSelectedAccount}
          testID={ConnectLedgerModalSelectors.connectAccountButton}
        >
          <T id="connect" />
        </StyledButton>
      </ActionsButtonsBox>
    </FadeTransition>
  );
});

interface LedgerAccountsSectionProps {
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  accounts: GroupedLedgerAccount[];
  onSelect: (index: number) => void;
  activeAccountIndex: number;
}

const LedgerAccountsSection = memo<LedgerAccountsSectionProps>(
  ({ title, subtitle, accounts, onSelect, activeAccountIndex }) => (
    <div className="flex flex-col gap-2 mb-6">
      <div className="flex flex-row justify-between">
        <span className="text-font-description-bold">{title}</span>
        {subtitle && <span className="text-font-description text-grey-2">Path: {subtitle}</span>}
      </div>
      <div className="flex flex-col gap-3">
        {accounts.map(({ account, listIndex }) => (
          <LedgerAccountCard
            key={account.address}
            account={account}
            index={listIndex}
            onSelect={onSelect}
            active={listIndex === activeAccountIndex}
          />
        ))}
      </div>
    </div>
  )
);

interface LedgerAccountCardProps {
  account: AccountProps;
  index: number;
  onSelect: (index: number) => void;
  active: boolean;
}

const LedgerAccountCard = memo<LedgerAccountCardProps>(({ account, index, onSelect, active }) => {
  const fullAccount = useMemo<StoredAccount>(
    () => ({
      type: TempleAccountType.Ledger,
      chain: account.chain,
      address: account.address,
      derivationPath: account.derivationPath,
      id: nanoid(),
      name: ''
    }),
    [account]
  );

  const handleClick = useCallback(() => onSelect(index), [index, onSelect]);

  const BalanceValue = useCallback(
    () => (
      <span>
        <Money smallFractionFont={false}>
          {account.chain === TempleChainKind.Tezos ? account.balanceTez : account.balanceEth}
        </Money>{' '}
        {(account.chain === TempleChainKind.Tezos ? TEZOS_METADATA : DEFAULT_EVM_CURRENCY).symbol}
      </span>
    ),
    [account]
  );

  return (
    <AccountCard
      customLabelTitle={`LEDGER #${account.index ?? 0}`}
      account={fullAccount}
      AccountName={AccountAddress}
      BalanceValue={BalanceValue}
      balanceLabel={`${t('balance')}:`}
      isCurrent={active}
      attractSelf={false}
      onClick={handleClick}
    />
  );
});

const AccountAddress = memo<{ account: StoredAccount }>(({ account }) => {
  const address = getAccountAddressForTezos(account) ?? getAccountAddressForEvm(account);
  const handleClick = useCopyText(address);

  return (
    <Button className="flex items-center gap-x-1 rounded-md py-1.5 px-2 hover:bg-secondary-low" onClick={handleClick}>
      <span className="text-font-medium-bold">
        <HashShortView hash={address!} firstCharsCount={6} lastCharsCount={4} />
      </span>

      <IconBase Icon={CopyIcon} size={12} className="text-secondary" />
    </Button>
  );
});
