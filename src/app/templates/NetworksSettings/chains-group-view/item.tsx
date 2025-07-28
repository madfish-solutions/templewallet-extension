import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { SearchHighlightText } from 'app/atoms/SearchHighlightText';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import { setAnotherSelector } from 'lib/analytics';
import { t } from 'lib/i18n';
import { Link } from 'lib/woozie';
import { OneOfChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { NetworkSettingsSelectors } from '../selectors';

interface ChainsGroupItemProps {
  item: OneOfChains;
  isLast: boolean;
  searchValue?: string;
}

export const ChainsGroupItem = memo<ChainsGroupItemProps>(({ item, isLast, searchValue }) => {
  const chainName = item.nameI18nKey ? t(item.nameI18nKey) : item.name;

  return (
    <SettingsCellSingle
      isLast={isLast}
      cellIcon={<ChainIcon item={item} />}
      cellName={
        <span className={clsx('text-font-medium-bold flex-1', item.disabled && 'text-grey-3')}>
          {searchValue ? <SearchHighlightText searchValue={searchValue}>{chainName}</SearchHighlightText> : chainName}
        </span>
      }
      wrapCellName={false}
      Component={Link}
      to={`/settings/networks/${item.kind}/${item.chainId}`}
      testID={NetworkSettingsSelectors.networkItem}
      {...setAnotherSelector('url', item.rpcBaseURL)}
    >
      <IconBase size={16} className="text-primary" Icon={ChevronRightIcon} />
    </SettingsCellSingle>
  );
});

const ChainIcon = memo<{ item: OneOfChains }>(({ item }) => {
  const { chainId, kind, disabled } = item;

  const commonProps = useMemo(() => ({ size: 24, className: clsx(disabled && 'opacity-65') }), [disabled]);

  return kind === TempleChainKind.EVM ? (
    <EvmNetworkLogo chainId={chainId} {...commonProps} />
  ) : (
    <TezosNetworkLogo chainId={chainId} {...commonProps} />
  );
});
