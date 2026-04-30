import React, { FC, ReactNode, memo } from 'react';

import { FieldValues, FormProvider, UseFormReturn } from 'react-hook-form';

import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { StyledButton } from 'app/atoms/StyledButton';
import { CurrencyIcon } from 'app/pages/Buy/CryptoExchange/components/CurrencyIcon';
import { CurrentAccount } from 'app/templates/current-account';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { LedgerOperationState } from 'lib/ui';
import { LedgerFullViewPromptModal, LedgerFullViewPromptModalProps } from 'lib/ui/LedgerFullViewPrompt';
import { ChartListItem } from 'app/templates/chart-list-item';
import { CROSS_CHAIN_DEFAULT_ETA, CrossChainAsset } from 'lib/cross-chain';
import { T, t } from 'lib/i18n';
import { useEvmChainByChainId, useTezosChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { CrossChainAmountRow } from '../../components/CrossChainAmountRow';

interface ExpectedResultCardProps {
  fromAsset: CrossChainAsset;
  fromAmount: string;
  feeFooter: ReactNode;
}

export const ExpectedResultCard = memo<ExpectedResultCardProps>(({ fromAsset, fromAmount, feeFooter }) => (
  <div className="bg-white p-4 pb-2 border-0.5 border-lines rounded-8 flex flex-col gap-y-2">
    <p className="text-font-description-bold text-grey-1">
      <T id="expectedResult" />
    </p>

    <CrossChainAmountRow asset={fromAsset} amount={fromAmount} sign="-" />

    <div className="h-px -mx-4 bg-lines" />

    {feeFooter}
  </div>
));

interface NetworkRowsProps {
  recipientNode: ReactNode;
  fromAsset: CrossChainAsset;
  toAsset: CrossChainAsset;
}

export const NetworkRows: FC<NetworkRowsProps> = ({ recipientNode, fromAsset, toAsset }) => {
  const fromEvmNetwork = useEvmChainByChainId(Number(fromAsset.chainId ?? 0));
  const fromTezosNetwork = useTezosChainByChainId(String(fromAsset.chainId ?? ''));
  const toEvmNetwork = useEvmChainByChainId(Number(toAsset.chainId ?? 0));
  const toTezosNetwork = useTezosChainByChainId(String(toAsset.chainId ?? ''));

  const fromNetworkName = resolveNetworkName(fromAsset, fromEvmNetwork?.name, fromTezosNetwork?.name);
  const toNetworkName = resolveNetworkName(toAsset, toEvmNetwork?.name, toTezosNetwork?.name);

  return (
    <div className="bg-white py-2 px-4 rounded-8 border-0.5 border-lines flex flex-col">
      <ChartListItem title={t('recipient')}>{recipientNode}</ChartListItem>
      <ChartListItem title={t('networkFrom')}>
        <NetworkCell name={fromNetworkName} asset={fromAsset} />
      </ChartListItem>
      <ChartListItem title={t('networkTo')}>
        <NetworkCell name={toNetworkName} asset={toAsset} />
      </ChartListItem>
      <ChartListItem title="Est. time" bottomSeparator={false}>
        <span className="p-1 text-font-num-12">{CROSS_CHAIN_DEFAULT_ETA}</span>
      </ChartListItem>
    </div>
  );
};

interface NetworkCellProps {
  name: string;
  asset: CrossChainAsset;
}

const NetworkCell = memo<NetworkCellProps>(({ name, asset }) => (
  <div className="flex items-center gap-x-1 p-1">
    <span className="text-font-num-12">{name}</span>
    <AssetNetworkBadge asset={asset} />
  </div>
));

const AssetNetworkBadge = memo<{ asset: CrossChainAsset }>(({ asset }) => {
  if (asset.chainKind === TempleChainKind.Tezos && asset.chainId != null) {
    return <TezosNetworkLogo size={16} chainId={String(asset.chainId)} />;
  }
  if (asset.chainKind === TempleChainKind.EVM && asset.chainId != null) {
    return <EvmNetworkLogo size={16} chainId={Number(asset.chainId)} />;
  }
  return <CurrencyIcon src={asset.iconUrl ?? ''} code={asset.exolixCoin} size={16} />;
});

const resolveNetworkName = (asset: CrossChainAsset, evmName?: string, tezosName?: string): string => {
  if (asset.dest === 'btc') return 'Bitcoin';
  if (asset.chainKind === TempleChainKind.EVM) return evmName ?? 'EVM';
  if (asset.chainKind === TempleChainKind.Tezos) return tezosName ?? 'Tezos';
  return asset.name;
};

interface PreviewBodyShellProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  formId: string;
  chainKind: TempleChainKind;
  expectedResultCard: ReactNode;
  tabs: ReactNode;
  isSubmitting: boolean;
  hasSubmitError: boolean;
  ledgerApprovalState: LedgerOperationState;
  onLedgerApprovalClose: EmptyFn;
  ledgerPromptProps: LedgerFullViewPromptModalProps;
  onCancel: EmptyFn;
}

/**
 * Shared layout for the EVM and Tezos cross-chain preview bodies.
 */
export const PreviewBodyShell = <TFieldValues extends FieldValues>({
  form,
  formId,
  chainKind,
  expectedResultCard,
  tabs,
  isSubmitting,
  hasSubmitError,
  ledgerApprovalState,
  onLedgerApprovalClose,
  ledgerPromptProps,
  onCancel
}: PreviewBodyShellProps<TFieldValues>) => (
  <FormProvider {...form}>
    <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-4 flex flex-col gap-y-4">
      {expectedResultCard}

      <CurrentAccount />

      {tabs}
    </div>

    <ActionsButtonsBox flexDirection="row" shouldChangeBottomShift={false}>
      <StyledButton size="L" className="w-full" color="primary-low" onClick={onCancel} disabled={isSubmitting}>
        <T id="cancel" />
      </StyledButton>
      <StyledButton type="submit" form={formId} size="L" className="w-full" color="primary" loading={isSubmitting}>
        <T id={hasSubmitError ? 'retry' : 'confirm'} />
      </StyledButton>
    </ActionsButtonsBox>

    <LedgerApprovalModal state={ledgerApprovalState} onClose={onLedgerApprovalClose} chainKind={chainKind} />
    <LedgerFullViewPromptModal {...ledgerPromptProps} />
  </FormProvider>
);
