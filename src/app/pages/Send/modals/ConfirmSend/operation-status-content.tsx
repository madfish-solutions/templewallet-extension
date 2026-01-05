import React, { FC } from 'react';

import clsx from 'clsx';

import { Anchor, HashShortView, IconBase, Loader } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { CopyAddress } from 'app/atoms/copy-address';
import { HashChip } from 'app/atoms/HashChip';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { EvmNetworksLogos } from 'app/atoms/NetworksLogos';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { TextButton } from 'app/atoms/TextButton';
import { ReactComponent as CheckmarkFillIcon } from 'app/icons/base/checkmark_fill.svg';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { ReactComponent as ErrorFillIcon } from 'app/icons/typed-msg/error.svg';
import { usePendingEvmTransferStatusSelector } from 'app/store/evm/pending-transactions/selectors';
import { usePendingTezosTransactionStatusSelector } from 'app/store/tezos/pending-transactions/selectors';
import { BalancesChangesView } from 'app/templates/balances-changes-view';
import { ChartListItem } from 'app/templates/chart-list-item';
import { FeeSummary } from 'app/templates/fee-summary';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { T, t } from 'lib/i18n';
import { useCategorizedTezosAssetMetadata, useEvmCategorizedAssetMetadata } from 'lib/metadata';
import { useCopyText } from 'lib/ui/hooks/use-copy-text';
import { ChainId, TxHash } from 'temple/front/chains';
import { useBlockExplorerHref } from 'temple/front/use-block-explorers';
import { PendingTransactionStatus, TempleChainKind } from 'temple/types';

import { ReviewDataForChain, TxData } from './types';
import { useSendBalancesChanges } from './use-send-balances-changes';

interface OperationStatusContentHOCInput<T extends TempleChainKind> {
  useTransactionStatus: (txHash: TxHash<T>) => PendingTransactionStatus;
  useAssetMetadata: (assetSlug: string, chainId: ChainId<T>) => { decimals?: number } | undefined;
}

interface OperationStatusContentHOCProps<T extends TempleChainKind> {
  data: ReviewDataForChain<T>;
  onClose: EmptyFn;
  txData: TxData<T>;
}

const statusLabelProps = {
  DONE: {
    className: 'bg-success-low text-success',
    icon: <IconBase size={12} className="p-0.5" iconTransform="scale(1)" Icon={CheckmarkFillIcon} />,
    labelI18nKey: 'success'
  },
  PENDING: {
    className: 'bg-grey-4 text-grey-1',
    icon: <Loader size="XS" trackVariant="dark" className="text-secondary mr-1 my-0.5" />,
    labelI18nKey: 'pending'
  },
  FAILED: {
    className: 'bg-error-low text-error',
    icon: <ErrorFillIcon className="w-3 h-3 m-0.5" />,
    labelI18nKey: 'failed'
  }
} as const;

const OperationStatusContentHOC = <T extends TempleChainKind>({
  useTransactionStatus,
  useAssetMetadata
}: OperationStatusContentHOCInput<T>) => {
  const ChainOperationStatusContent: FC<OperationStatusContentHOCProps<T>> = ({ data, onClose, txData }) => {
    const { txHash, displayedFee, displayedStorageFee } = txData;
    const { network, assetSlug, amount, account } = data;
    const status = useTransactionStatus(txHash);
    const assetMetadata = useAssetMetadata(assetSlug, network.chainId);
    const balancesChanges = useSendBalancesChanges(assetSlug, amount, assetMetadata?.decimals);
    const blockExplorerUrl = useBlockExplorerHref(network.kind, network.chainId, 'tx', txHash);
    const PartnersPromotionModule = usePartnersPromotionModule();

    return (
      <>
        <div className="px-4 flex flex-col flex-1 overflow-y-scroll">
          <div className="mt-4 mb-3 flex flex-col gap-2">
            <BalancesChangesView
              balancesChanges={balancesChanges}
              chain={data.network}
              title={
                <div className="flex justify-between items-center gap-2">
                  <span className="text-font-description-bold">{t('status')}</span>
                  <div
                    className={clsx(
                      'flex items-center py-1 rounded-6 text-font-num-10 font-semibold pr-2 pl-1.5 uppercase',
                      statusLabelProps[status].className
                    )}
                  >
                    {statusLabelProps[status].icon}
                    <span>{t(statusLabelProps[status].labelI18nKey)}</span>
                  </div>
                </div>
              }
              footer={
                <FeeSummary
                  network={data.network}
                  assetSlug={assetSlug}
                  gasFee={displayedFee}
                  storageFee={displayedStorageFee}
                  embedded
                />
              }
            />

            <div className="flex flex-col px-4 py-2 rounded-lg border-0.5 border-lines bg-white">
              <ChartListItem title={<T id="sender" />}>
                <div className="flex flex-row items-center">
                  <div className="flex items-center gap-0.5 px-1 py-0.5">
                    <EvmNetworksLogos size={16} />
                    <CopyAddress
                      firstCharsCount={5}
                      address={account.address}
                      textClassName="text-font-num-12 text-text"
                    />
                  </div>
                  <AccountAvatar size={24} seed={account.id} />
                </div>
              </ChartListItem>

              <ChartListItem title={<T id="recipient" />}>
                <HashChip hash={data.to} firstCharsCount={6} />
              </ChartListItem>

              <ChartListItem title={<T id="network" />}>
                <div className="flex flex-row items-center gap-0.5">
                  <span className="p-1 text-font-num-12">{network.name}</span>
                  {network.kind === TempleChainKind.EVM ? (
                    <EvmNetworkLogo chainId={network.chainId} size={16} />
                  ) : (
                    <TezosNetworkLogo chainId={network.chainId} size={16} />
                  )}
                </div>
              </ChartListItem>

              <ChartListItem title={<T id="txHash" />} bottomSeparator={false}>
                {blockExplorerUrl ? (
                  <Anchor
                    href={blockExplorerUrl}
                    className="flex gap-0.5 p-0.5 text-secondary hover:bg-secondary-low rounded cursor-pointer text-font-num-12"
                  >
                    <span>
                      <HashShortView firstCharsCount={6} hash={txHash} />
                    </span>
                    <IconBase Icon={OutLinkIcon} size={12} />
                  </Anchor>
                ) : (
                  <NoBlockExplorerHashButton txHash={txHash} />
                )}
              </ChartListItem>
            </div>

            {PartnersPromotionModule && (
              <PartnersPromotionModule.PartnersPromotion
                id="promo-send-status-content"
                variant={PartnersPromotionModule.PartnersPromotionVariant.Text}
                pageName="Send"
              />
            )}
          </div>
        </div>

        <ActionsButtonsBox flexDirection="row" shouldChangeBottomShift={false}>
          <StyledButton size="L" className="w-full" color="primary-low" onClick={onClose}>
            <T id="close" />
          </StyledButton>
        </ActionsButtonsBox>
      </>
    );
  };

  return ChainOperationStatusContent;
};

const NoBlockExplorerHashButton = ({ txHash }: { txHash: string }) => (
  <TextButton
    color="blue"
    className="gap-0.5 pl-0.5 pr-0.5"
    textClassName="!text-font-num-12"
    Icon={CopyIcon}
    onClick={useCopyText(txHash, true)}
  >
    <HashShortView firstCharsCount={6} hash={txHash} />
  </TextButton>
);

export const TezosOperationStatusContent = OperationStatusContentHOC<TempleChainKind.Tezos>({
  useTransactionStatus: usePendingTezosTransactionStatusSelector,
  useAssetMetadata: useCategorizedTezosAssetMetadata
});

export const EvmOperationStatusContent = OperationStatusContentHOC<TempleChainKind.EVM>({
  useTransactionStatus: usePendingEvmTransferStatusSelector,
  useAssetMetadata: useEvmCategorizedAssetMetadata
});
