import React, { memo } from 'react';

import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import { ContentContainer } from 'app/layouts/containers';
import { ActivityTab } from 'app/templates/activity/Activity';
import AssetInfo from 'app/templates/AssetInfo';
import { TabsBar, TabsBarTabInterface } from 'app/templates/TabBar';
import { TEZ_TOKEN_SLUG, isTezAsset } from 'lib/assets';
import { t } from 'lib/i18n';

import BakingSection from './BakingSection';

interface Props {
  tezosChainId: string;
  assetSlug: string;
}

export const TezosAssetTab = memo<Props>(({ tezosChainId, assetSlug }) => (
  <ContentContainer className="mt-3">
    {isTezAsset(assetSlug) ? (
      <TezosGasTab tezosChainId={tezosChainId} />
    ) : (
      <TezosTokenTab tezosChainId={tezosChainId} assetSlug={assetSlug} />
    )}
  </ContentContainer>
));

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

const TezosTokenTab = memo<{ tezosChainId: string; assetSlug: string }>(({ tezosChainId, assetSlug }) => {
  const tabSlug = useLocationSearchParamValue('tab');
  const tabName = tabSlug === 'info' ? 'info' : 'activity';

  return (
    <>
      <TabsBar tabs={TEZOS_TOKEN_TABS} activeTabName={tabName} />

      {tabName === 'activity' ? (
        <ActivityTab tezosChainId={tezosChainId} assetSlug={assetSlug} />
      ) : (
        <AssetInfo tezosChainId={tezosChainId} assetSlug={assetSlug} />
      )}
    </>
  );
});
