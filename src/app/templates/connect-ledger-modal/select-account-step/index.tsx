import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { DerivationType } from '@taquito/ledger-signer';
import { nanoid } from 'nanoid';

import { Button, HashShortView, IconBase, Money } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { StyledButton } from 'app/atoms/StyledButton';
import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { AccountCard } from 'app/templates/AccountCard';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { toastError, toastSuccess } from 'app/toaster';
import { T, t } from 'lib/i18n';
import { TEZOS_METADATA } from 'lib/metadata';
import { useTempleClient } from 'lib/temple/front';
import { fetchNewAccountName, getDerivationPath } from 'lib/temple/helpers';
import { StoredAccount, TempleAccountType } from 'lib/temple/types';
import { LedgerOperationState, runConnectedLedgerOperationFlow } from 'lib/ui';
import { useBooleanState } from 'lib/ui/hooks';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { DEFAULT_EVM_CURRENCY } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { ConnectLedgerModalSelectors } from '../selectors';
import { AccountProps } from '../types';
import { useGetLedgerEvmAccount, useGetLedgerTezosAccount, useUsedDerivationIndexes } from '../utils';

import { CustomPathFormData, CustomPathModal } from './custom-path-modal';
import { DerivationTypeSelector } from './derivation-type-selector';

interface SelectAccountStepProps {
  initialAccount: AccountProps;
  onSuccess: EmptyFn;
}

export const SelectAccountStep = memo<SelectAccountStepProps>(({ initialAccount, onSuccess }) => {
  const { accounts, createLedgerAccount } = useTempleClient();

  const [knownAccountsByDerivation, setKnownAccountsByDerivation] = useState<Record<DerivationType, AccountProps[]>>({
    [DerivationType.ED25519]: [initialAccount],
    [DerivationType.SECP256K1]: [],
    [DerivationType.P256]: [],
    [DerivationType.BIP32_ED25519]: []
  });
  const [activeAccountsIndexes, setActiveAccountsIndexes] = useState<Record<DerivationType, number>>({
    [DerivationType.ED25519]: 0,
    [DerivationType.SECP256K1]: -1,
    [DerivationType.P256]: -1,
    [DerivationType.BIP32_ED25519]: -1
  });
  const [isSwitchingDerivation, setIsSwitchingDerivation] = useState(false);
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [derivationType, setDerivationType] = useState<DerivationType>(DerivationType.ED25519);
  const [customPathModalIsOpen, openCustomPathModal, closeCustomPathModal] = useBooleanState(false);
  const knownLedgerAccounts = knownAccountsByDerivation[derivationType];
  const activeAccountIndex = activeAccountsIndexes[derivationType];

  const {
    ledgerApprovalModalState,
    setLedgerApprovalModalState,
    handleLedgerModalClose: handleApproveModalClose
  } = useLedgerApprovalModalState();
  const approveModalVisible = ledgerApprovalModalState !== LedgerOperationState.NotStarted;
  const getLedgerTezosAccount = useGetLedgerTezosAccount();
  const getLedgerEvmAccount = useGetLedgerEvmAccount();
  const alreadyInWalletIndexes = useUsedDerivationIndexes(initialAccount.chain, derivationType);
  const alreadyInTmpListIndexes = useMemo(() => knownLedgerAccounts.map(a => a.derivationIndex), [knownLedgerAccounts]);
  const pickTezosAccounts = initialAccount.chain === TempleChainKind.Tezos;

  const submitSelectedAccount = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const { derivationIndex, chain, ...restProps } = knownLedgerAccounts[activeAccountIndex];
      await createLedgerAccount({
        ...restProps,
        chain,
        name: await fetchNewAccountName(accounts, TempleAccountType.Ledger, i => t('defaultLedgerName', String(i))),
        derivationPath: getDerivationPath(chain, derivationIndex)
      });
      onSuccess();
    } catch (e: any) {
      toastError(e.message ?? t('unknownError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [accounts, activeAccountIndex, createLedgerAccount, knownLedgerAccounts, onSuccess]);

  const importLedgerAccount = useCallback(
    (currentDerivationType: DerivationType, derivationIndex?: number) =>
      runConnectedLedgerOperationFlow(async () => {
        const newAccount = pickTezosAccounts
          ? await getLedgerTezosAccount(currentDerivationType, derivationIndex)
          : await getLedgerEvmAccount(derivationIndex);
        setKnownAccountsByDerivation(prevAccounts => ({
          ...prevAccounts,
          [currentDerivationType]: prevAccounts[currentDerivationType].concat(newAccount)
        }));
        setActiveAccountsIndexes(prevIndexes => ({
          ...prevIndexes,
          [currentDerivationType]: prevIndexes[currentDerivationType] + 1
        }));
      }, setLedgerApprovalModalState),
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
    async ({ index: derivationIndex }: CustomPathFormData) => {
      closeCustomPathModal();
      await importLedgerAccount(derivationType, Number(derivationIndex));
    },
    [closeCustomPathModal, derivationType, importLedgerAccount]
  );

  const handleAccountSelect = useCallback(
    (accountIndex: number) => {
      setActiveAccountsIndexes(prevIndexes => ({ ...prevIndexes, [derivationType]: accountIndex }));
    },
    [derivationType]
  );

  return (
    <>
      <LedgerApprovalModal
        state={ledgerApprovalModalState}
        isSwitchingDerivation={isSwitchingDerivation}
        onClose={handleApproveModalClose}
      />

      {customPathModalIsOpen && (
        <CustomPathModal
          alreadyInTmpListIndexes={alreadyInTmpListIndexes}
          alreadyInWalletIndexes={alreadyInWalletIndexes}
          onClose={closeCustomPathModal}
          onSubmit={handleCustomPathModalSubmit}
        />
      )}

      <ScrollView className="gap-6 pt-4" onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}>
        <>
          {pickTezosAccounts && (
            <div className="flex flex-col gap-1">
              <span className="text-font-description-bold m-1">
                <T id="derivationType" />
              </span>

              <DerivationTypeSelector onSelect={handleDerivationTypeSelect} derivationType={derivationType} />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-font-description-bold m-1">
                <T id={pickTezosAccounts ? 'selectAccount' : 'selectLedgerLiveAccount'} />
              </span>
              <StyledButton
                color="secondary-low"
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
          </div>
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
    </>
  );
});

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
      derivationPath: getDerivationPath(TempleChainKind.Tezos, account.derivationIndex),
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
      customLabelTitle={`LEDGER #${account.derivationIndex}`}
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
  const address = (getAccountAddressForTezos(account) ?? getAccountAddressForEvm(account))!;
  const handleClick = useCallback(() => {
    window.navigator.clipboard.writeText(address);
    toastSuccess(t('copiedAddress'));
  }, [address]);

  return (
    <Button className="flex items-center gap-x-1 rounded-md py-1.5 px-2 hover:bg-secondary-low" onClick={handleClick}>
      <span className="text-font-medium-bold">
        <HashShortView hash={address} firstCharsCount={6} lastCharsCount={4} />
      </span>

      <IconBase Icon={CopyIcon} size={12} className="text-secondary" />
    </Button>
  );
});
