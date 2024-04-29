import React, { memo } from 'react';

import { useLocationSearchParamValue } from 'app/hooks/use-location';
import { ActivityTab } from 'app/templates/activity/Activity';
import AssetInfo from 'app/templates/AssetInfo';
import { TabsBar, TabsBarTabInterface } from 'app/templates/TabBar';
import { TEZ_TOKEN_SLUG, isTezAsset } from 'lib/assets';

import BakingSection from './BakingSection';

interface Props {
  tezosChainId: string;
  assetSlug: string;
}

export const TezosAssetTab = memo<Props>(({ tezosChainId, assetSlug }) => {
  if (isTezAsset(assetSlug)) return <TezosGasTab tezosChainId={tezosChainId} />;

  return <TezosTokenTab tezosChainId={tezosChainId} assetSlug={assetSlug} />;
});

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
        <BakingSection tezosChainId={tezosChainId} />
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