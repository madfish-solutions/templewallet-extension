import React, { FC } from 'react';

import HashShortView from 'app/atoms/HashShortView';
import { useKnownBakerOrPayoutAccount } from 'lib/temple/front';

interface Props {
  bakerAddress: string;
}

export const BakerName: FC<Props> = ({ bakerAddress }) => {
  const { data: bakerOrPayoutAccount } = useKnownBakerOrPayoutAccount(bakerAddress);

  return <>{bakerOrPayoutAccount?.name ?? <HashShortView hash={bakerAddress} />}</>;
};
