import React, { memo } from 'react';

import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import { ContentContainer } from 'app/layouts/containers';
import { ActivityTab } from 'app/templates/activity/Activity';
import AssetInfo from 'app/templates/AssetInfo';
import { TabsBar, TabsBarTabInterface } from 'app/templates/TabBar';
import { TEZ_TOKEN_SLUG, isTezAsset } from 'lib/assets';
import { t } from 'lib/i18n';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { TempleChainKind } from 'temple/types';

import { HomeProps } from '../interfaces';

import BakingSection from './BakingSection';

export const AssetTab = memo<NonNullableFields<Required<HomeProps>>>(({ chainKind, chainId, assetSlug }) => (
  <ContentContainer className="mt-3">
    {chainKind === TempleChainKind.Tezos ? (
      <TezosAssetTab chainId={chainId} assetSlug={assetSlug} />
    ) : (
      <EvmTokenTab chainId={chainId} assetSlug={assetSlug} />
    )}
  </ContentContainer>
));

interface AssetTabProps {
  chainId: string;
  assetSlug: string;
}

const TezosAssetTab = memo<AssetTabProps>(({ chainId, assetSlug }) =>
  isTezAsset(assetSlug) ? (
    <TezosGasTab tezosChainId={chainId} />
  ) : (
    <TezosTokenTab chainId={chainId} assetSlug={assetSlug} />
  )
);

const TEZOS_GAS_TABS: TabsBarTabInterface[] = [
  { name: 'activity', titleI18nKey: 'activity' },
  { name: 'delegation', titleI18nKey: 'delegate' }
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

const TEZOS_TOKEN_TABS: TabsBarTabInterface[] = [
  { name: 'activity', titleI18nKey: 'activity' },
  { name: 'info', titleI18nKey: 'info' }
];

const TezosTokenTab = memo<AssetTabProps>(({ chainId, assetSlug }) => {
  const tabSlug = useLocationSearchParamValue('tab');
  const tabName = tabSlug === 'info' ? 'info' : 'activity';

  return (
    <>
      <TabsBar tabs={TEZOS_TOKEN_TABS} activeTabName={tabName} />

      {tabName === 'activity' ? (
        <ActivityTab tezosChainId={chainId} assetSlug={assetSlug} />
      ) : (
        <AssetInfo chainKind={TempleChainKind.Tezos} chainId={chainId} assetSlug={assetSlug} />
      )}
    </>
  );
});

const EVM_TOKEN_TABS: TabsBarTabInterface[] = [
  { name: 'activity', titleI18nKey: 'activity' },
  { name: 'info', titleI18nKey: 'info' }
];

const EvmTokenTab = memo<AssetTabProps>(({ chainId, assetSlug }) => {
  const tabSlug = useLocationSearchParamValue('tab');
  const tabName = tabSlug === 'info' ? 'info' : 'activity';

  return (
    <>
      <TabsBar tabs={EVM_TOKEN_TABS} activeTabName={tabName} />

      {tabName === 'activity' ? (
        <div className="text-center py-3">{UNDER_DEVELOPMENT_MSG}</div>
      ) : (
        <AssetInfo chainKind={TempleChainKind.EVM} chainId={chainId} assetSlug={assetSlug} />
      )}
    </>
  );
});
