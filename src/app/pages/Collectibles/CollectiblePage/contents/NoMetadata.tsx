import React, { FC, ReactNode } from 'react';

import { IconBase } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as RefreshIcon } from 'app/icons/base/refresh.svg';
import PageLayout from 'app/layouts/PageLayout';
import { t, T } from 'lib/i18n';
import { TempleAccountType } from 'lib/temple/types';
import { useAccount, EvmChain, TezosChain, OneOfChains } from 'temple/front';

import { CollectibleImageFallback } from '../../components/CollectibleImageFallback';
import { EvmDetails, TezosDetails } from '../components/Details';
import { ImageContainer } from '../components/ImageContainer';
import { QuickActionsPopper } from '../components/QuickActionsPopper';
import { useLoadCollectibleMetadata } from '../hooks/use-load-collectible-metadata';
import { CollectiblesSelectors } from '../selectors';

interface EvmProps {
  assetSlug: string;
  network: EvmChain;
  accountPkh: HexString;
  onSendClick?: EmptyFn;
}

export const EvmNoMetadataContent: FC<EvmProps> = props => (
  <NoMetadataContent
    {...props}
    detailsElement={<EvmDetails network={props.network} assetSlug={props.assetSlug} accountPkh={props.accountPkh} />}
  />
);

interface TezosProps {
  assetSlug: string;
  network: TezosChain;
  accountPkh: string;
  onSendClick?: EmptyFn;
}

export const TezosNoMetadataContent: FC<TezosProps> = props => (
  <NoMetadataContent
    {...props}
    detailsElement={
      <TezosDetails
        network={props.network}
        assetSlug={props.assetSlug}
        accountPkh={props.accountPkh}
        shouldShowEmptyRows={false}
      />
    }
  />
);

interface BaseProps {
  assetSlug: string;
  network: OneOfChains;
  onSendClick?: EmptyFn;
  detailsElement: ReactNode;
}

const NoMetadataContent: FC<BaseProps> = ({ assetSlug, network, onSendClick, detailsElement }) => {
  const account = useAccount();
  const { isLoading, loadMetadata } = useLoadCollectibleMetadata(network, assetSlug);

  return (
    <PageLayout headerRightElem={<QuickActionsPopper assetSlug={assetSlug} network={network} />}>
      {isLoading ? (
        <PageLoader text={t('metadataLoading')} stretch />
      ) : (
        <>
          <ImageContainer>
            <CollectibleImageFallback large />
          </ImageContainer>

          <StyledButton
            size="L"
            color="primary"
            onClick={onSendClick}
            testID={CollectiblesSelectors.sendButton}
            className="my-6"
            disabled={account.type === TempleAccountType.WatchOnly}
          >
            <T id="send" />
          </StyledButton>

          {detailsElement}

          <div className="mt-6 flex justify-center">
            <StyledButton
              size="S"
              color="secondary-low"
              className="!bg-transparent flex items-center !px-0 py-0.5 gap-0.5"
              onClick={loadMetadata}
              testID={CollectiblesSelectors.refreshMetadataButton}
            >
              <T id="refreshMetadata" />
              <IconBase size={12} Icon={RefreshIcon} />
            </StyledButton>
          </div>
        </>
      )}
    </PageLayout>
  );
};
