import React, { FC, memo } from 'react';

import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import { ContentContainer } from 'app/layouts/containers';
import { ActivityTab, EvmActivityTab } from 'app/templates/activity/Activity';
import AssetInfo from 'app/templates/AssetInfo';
import { TabsBar, TabsBarTabInterface } from 'app/templates/TabBar';
import { TEZ_TOKEN_SLUG, isTezAsset } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { t } from 'lib/i18n';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { TempleChainKind } from 'temple/types';

import { HomeProps } from '../interfaces';

import BakingSection from './BakingSection';

export const AssetTab = memo<NonNullableFields<Required<HomeProps>>>(({ chainKind, chainId, assetSlug }) => (
  <ContentContainer className="mt-3">
    {chainKind === TempleChainKind.Tezos ? (
      <TezosAssetTab chainId={chainId} assetSlug={assetSlug} />
    ) : (
      <EvmAssetTab chainId={Number(chainId)} assetSlug={assetSlug} />
    )}
  </ContentContainer>
));

interface TezosAssetTabProps {
  chainId: string;
  assetSlug: string;
}

const TezosAssetTab: FC<TezosAssetTabProps> = ({ chainId, assetSlug }) =>
  isTezAsset(assetSlug) ? (
    <TezosGasTab tezosChainId={chainId} />
  ) : (
    <TezosTokenTab chainId={chainId} assetSlug={assetSlug} />
  );

const TEZOS_GAS_TABS: TabsBarTabInterface[] = [
  { name: 'activity', titleI18nKey: 'activity' },
  { name: 'delegation', titleI18nKey: 'delegateAndStake' }
];

const TezosGasTab = memo<{ tezosChainId: string }>(({ tezosChainId }) => {
  const tabSlug = useLocationSearchParamValue('tab');
  const tabName = tabSlug === 'delegation' ? 'delegation' : 'activity';

  return (
    <>
      <TabsBar tabs={TEZOS_GAS_TABS} activeTabName={tabName} />

      {tabName === 'activity' ? (
        <ActivityTab tezosChainId={tezosChainId} assetSlug={TEZ_TOKEN_SLUG} />
      ) : (
        <SuspenseContainer errorMessage={t('delegationInfoWhileMessage')}>
          <BakingSection tezosChainId={tezosChainId} />
        </SuspenseContainer>
      )}
    </>
  );
});

const TOKEN_TABS: TabsBarTabInterface[] = [
  { name: 'activity', titleI18nKey: 'activity' },
  { name: 'info', titleI18nKey: 'info' }
];

const TezosTokenTab = memo<TezosAssetTabProps>(({ chainId, assetSlug }) => {
  const tabSlug = useLocationSearchParamValue('tab');
  const tabName = tabSlug === 'info' ? 'info' : 'activity';

  return (
    <>
      <TabsBar tabs={TOKEN_TABS} activeTabName={tabName} />

      {tabName === 'activity' ? (
        <ActivityTab tezosChainId={chainId} assetSlug={assetSlug} />
      ) : (
        <AssetInfo chainKind={TempleChainKind.Tezos} chainId={chainId} assetSlug={assetSlug} />
      )}
    </>
  );
});

interface EvmAssetTabProps {
  chainId: number;
  assetSlug: string;
}

const EvmAssetTab: FC<EvmAssetTabProps> = ({ chainId, assetSlug }) =>
  isEvmNativeTokenSlug(assetSlug) ? (
    <EvmGasTab chainId={chainId} />
  ) : (
    <EvmTokenTab chainId={chainId} assetSlug={assetSlug} />
  );

const EVM_GAS_TABS: TabsBarTabInterface[] = [{ name: 'activity', titleI18nKey: 'activity' }];

const EvmGasTab = memo<{ chainId: number }>(({ chainId }) => {
  const tabName = 'activity';

  return (
    <>
      <TabsBar tabs={EVM_GAS_TABS} activeTabName={tabName} />

      <EvmActivityTab chainId={chainId} assetSlug={TEZ_TOKEN_SLUG} />
    </>
  );
});

const EvmTokenTab = memo<EvmAssetTabProps>(({ chainId, assetSlug }) => {
  const tabSlug = useLocationSearchParamValue('tab');
  const tabName = tabSlug === 'info' ? 'info' : 'activity';

  return (
    <>
      <TabsBar tabs={TOKEN_TABS} activeTabName={tabName} />

      {tabName === 'activity' ? (
        <EvmActivityTab chainId={chainId} assetSlug={EVM_TOKEN_SLUG} />
      ) : (
        <AssetInfo chainKind={TempleChainKind.EVM} chainId={String(chainId)} assetSlug={assetSlug} />
      )}
    </>
  );
});
