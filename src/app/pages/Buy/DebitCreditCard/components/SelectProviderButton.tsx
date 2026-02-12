import React, { memo } from 'react';

import { Button, IconBase } from 'app/atoms';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { TopUpProviderIcon } from 'app/templates/TopUpProviderIcon';
import { TestIDProperty } from 'lib/analytics';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { PaymentProviderInterface } from 'lib/buy-with-credit-card/topup.interface';

interface Props extends TestIDProperty {
  provider?: PaymentProviderInterface;
  onClick?: EmptyFn;
}

const DEFAULT_PROVIDER: PaymentProviderInterface = {
  name: 'MoonPay',
  id: TopUpProviderId.MoonPay,
  kycRequired: false,
  isBestPrice: false
};

export const SelectProviderButton = memo<Props>(({ provider = DEFAULT_PROVIDER, onClick, testID }) => (
  <Button
    className="w-full cursor-pointer flex justify-between items-center p-3 rounded-lg border-0.5 border-lines bg-white hover:bg-grey-4"
    testID={testID}
    onClick={onClick}
  >
    <div className="flex justify-center items-center gap-2">
      <TopUpProviderIcon providerId={provider.id} />

      <span className="text-font-medium-bold">{provider.name}</span>
    </div>
    <IconBase Icon={CompactDown} className="text-primary" size={16} />
  </Button>
));
