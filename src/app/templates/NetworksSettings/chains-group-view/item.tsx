import React, { memo } from 'react';

import { IconBase } from 'app/atoms';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import { ShortenedTextWithTooltip } from 'app/templates/shortened-text-with-tooltip';
import { setAnotherSelector } from 'lib/analytics';
import { t } from 'lib/i18n';
import { Link } from 'lib/woozie';
import { OneOfChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { NetworkSettingsSelectors } from '../selectors';

interface ChainsGroupItemProps {
  item: OneOfChains;
  isLast: boolean;
}

export const ChainsGroupItem = memo<ChainsGroupItemProps>(({ item, isLast }) => (
  <SettingsCellSingle
    isLast={isLast}
    cellIcon={
      item.kind === TempleChainKind.EVM ? (
        <EvmNetworkLogo chainId={item.chainId} size={24} />
      ) : (
        <TezosNetworkLogo chainId={item.chainId} size={24} />
      )
    }
    cellName={
      <ShortenedTextWithTooltip className="text-font-medium-bold flex-1">
        {item.nameI18nKey ? t(item.nameI18nKey) : item.name}
      </ShortenedTextWithTooltip>
    }
    wrapCellName={false}
    Component={Link}
    to={`/settings/networks/${item.kind}/${item.chainId}`}
    testID={NetworkSettingsSelectors.networkItem}
    {...setAnotherSelector('url', item.rpcBaseURL)}
  >
    <IconBase size={16} className="text-primary" Icon={ChevronRightIcon} />
  </SettingsCellSingle>
));
