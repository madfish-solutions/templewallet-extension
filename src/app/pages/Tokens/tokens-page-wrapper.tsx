import { FC } from 'react';

import { IconBase, ToggleSwitch } from 'app/atoms';
import { IconButton } from 'app/atoms/IconButton';
import { MiniPageModal } from 'app/atoms/PageModal/mini-page-modal';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { useTokensSearchState, useTokensSelectedChainsState } from 'app/hooks/use-assets-view-state';
import { ReactComponent as FilterOffIcon } from 'app/icons/base/filteroff.svg';
import { ReactComponent as FilterOnIcon } from 'app/icons/base/filteron.svg';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
import PageLayout from 'app/layouts/PageLayout';
import { dispatch } from 'app/store';
import {
  setTokensGroupByNetworkFilterOption,
  setTokensHideSmallBalanceFilterOption
} from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { SearchBarField } from 'app/templates/SearchField';
import { t, T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

import { TokensPageSelectors } from './selectors';

interface TokensPageWrapperProps extends PropsWithChildren {
  manageActive: boolean;
  toggleManageActive: EmptyFn;
}

export const TokensPageWrapper: FC<TokensPageWrapperProps> = ({ children, manageActive, toggleManageActive }) => {
  const isTestnet = useTestnetModeEnabledSelector();
  const { searchValue, setSearchValue } = useTokensSearchState();
  const { tokensListOptions } = useAssetsFilterOptionsSelector();
  const { chainIsGloballySelected } = useTokensSelectedChainsState();
  const [filtersModalOpen, openFiltersModal, closeFiltersModal] = useBooleanState(false);
  const { hideSmallBalance, groupByNetwork } = tokensListOptions;

  return (
    <PageLayout
      pageTitle={<T id="tokens" />}
      contentPadding={false}
      contentClassName="px-4 pb-8"
      headerRightElem={
        <IconBase
          Icon={hideSmallBalance || groupByNetwork ? FilterOnIcon : FilterOffIcon}
          className="text-primary cursor-pointer"
          onClick={openFiltersModal}
        />
      }
      headerChildren={
        <div className="flex p-4 gap-2 bg-background items-center">
          <SearchBarField
            value={searchValue}
            placeholder={t('search')}
            onValueChange={setSearchValue}
            testID={TokensPageSelectors.searchField}
          />

          <IconButton Icon={manageActive ? CloseIcon : ManageIcon} color="blue" onClick={toggleManageActive} />
        </div>
      }
    >
      {children}

      <MiniPageModal opened={filtersModalOpen} onRequestClose={closeFiltersModal} title={t('filters')}>
        <SettingsCellGroup className="m-4 mb-8">
          <SettingsCellSingle Component="div" cellName={t('hideSmallBalance')} isLast={false}>
            <ToggleSwitch
              checked={hideSmallBalance}
              disabled={isTestnet}
              onChange={value => dispatch(setTokensHideSmallBalanceFilterOption(value))}
              testID={TokensPageSelectors.hideSmallBalanceToggle}
            />
          </SettingsCellSingle>

          <SettingsCellSingle Component="div" cellName={t('groupByNetwork')}>
            <ToggleSwitch
              checked={groupByNetwork}
              disabled={chainIsGloballySelected}
              onChange={value => dispatch(setTokensGroupByNetworkFilterOption(value))}
              testID={TokensPageSelectors.groupByNetworkToggle}
            />
          </SettingsCellSingle>
        </SettingsCellGroup>
      </MiniPageModal>
    </PageLayout>
  );
};
