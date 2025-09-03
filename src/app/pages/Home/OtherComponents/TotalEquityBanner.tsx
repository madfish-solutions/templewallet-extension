import React, { FC, memo, useCallback } from 'react';

import { Button, IconBase } from 'app/atoms';
import { ActionListItem } from 'app/atoms/ActionListItem';
import { ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { TotalEquity } from 'app/atoms/TotalEquity';
import { EquityCurrency } from 'app/atoms/TotalEquity/types';
import { ReactComponent as CompactDownIcon } from 'app/icons/base/compact_down.svg';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { TOTAL_EQUITY_CURRENCY_STORAGE_KEY } from 'lib/constants';
import { useFiatCurrency } from 'lib/fiat-currency';
import { T } from 'lib/i18n';
import { usePassiveStorage } from 'lib/temple/front/storage';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { useAccount } from 'temple/front';

export const TotalEquityBanner = memo(() => {
  const { filterChain } = useAssetsFilterOptionsSelector();
  const account = useAccount();

  const [equityCurrency, setEquityCurrency] = usePassiveStorage<EquityCurrency>(
    TOTAL_EQUITY_CURRENCY_STORAGE_KEY,
    'fiat'
  );

  return (
    <div className="flex flex-col gap-y-0.5">
      <div className="text-font-description text-grey-1">
        <T id="totalEquityValue" />
      </div>

      <div className="flex items-center gap-x-1 text-font-num-bold-24">
        <div>
          <TotalEquity account={account} filterChain={filterChain} currency={equityCurrency} />
        </div>

        <Popper
          placement="bottom-start"
          strategy="fixed"
          popup={props => <EquityCurrencyDropdown {...props} setEquityCurrency={setEquityCurrency} />}
        >
          {({ ref, toggleOpened }) => (
            <Button ref={ref} onClick={toggleOpened}>
              <IconBase Icon={CompactDownIcon} size={12} className="text-primary" />
            </Button>
          )}
        </Popper>
      </div>
    </div>
  );
});

interface EquityCurrencyDropdownProps extends PopperRenderProps {
  setEquityCurrency: SyncFn<EquityCurrency>;
}

const EquityCurrencyDropdown = memo<EquityCurrencyDropdownProps>(({ opened, toggleOpened, setEquityCurrency }) => {
  const {
    selectedFiatCurrency: { name: fiatName }
  } = useFiatCurrency();

  return (
    <ActionsDropdownPopup title="Show balance in" opened={opened} lowering={2} style={{ minWidth: 126 }}>
      <EquityCurrencyButton
        value="btc"
        title="BTC"
        closeDropdown={toggleOpened}
        setEquityCurrency={setEquityCurrency}
      />

      <EquityCurrencyButton
        value="tez"
        title="TEZ"
        closeDropdown={toggleOpened}
        setEquityCurrency={setEquityCurrency}
      />

      <EquityCurrencyButton
        value="eth"
        title="ETH"
        closeDropdown={toggleOpened}
        setEquityCurrency={setEquityCurrency}
      />

      <EquityCurrencyButton
        value="fiat"
        title={fiatName}
        closeDropdown={toggleOpened}
        setEquityCurrency={setEquityCurrency}
      />
    </ActionsDropdownPopup>
  );
});

interface EquityCurrencyButtonProps {
  value: EquityCurrency;
  title: string;
  closeDropdown: EmptyFn;
  setEquityCurrency: SyncFn<EquityCurrency>;
}

const EquityCurrencyButton: FC<EquityCurrencyButtonProps> = ({ value, title, closeDropdown, setEquityCurrency }) => {
  const onClick = useCallback(() => {
    closeDropdown();
    setEquityCurrency(value);
  }, [setEquityCurrency, closeDropdown, value]);

  return <ActionListItem onClick={onClick}>{title}</ActionListItem>;
};
