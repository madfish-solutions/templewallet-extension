import React, { FC } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';

import { HashChip } from 'app/atoms/HashChip';
import AddressChip from 'app/templates/AddressChip';
import { OpenInExplorerChip } from 'app/templates/OpenInExplorerChip';
import { DisplayableActivity } from 'lib/temple/activity-new/types';
import { getActor, getActivityTypeFlags } from 'lib/temple/activity-new/utils';

import { ActivitySelectors } from '../selectors';
import styles from './activity-item.module.css';

interface ActorChipProps {
  activity: DisplayableActivity;
}

export const ActorChip: FC<ActorChipProps> = ({ activity }) => {
  const { actor } = getActor(activity);

  const { isDelegation, isBakingRewards, isAllowanceChange } = getActivityTypeFlags(activity);

  if (!isDefined(actor)) {
    return <span className="text-gray-500 text-xs leading-5">‒</span>;
  }

  if (isDelegation || isBakingRewards || isAllowanceChange) {
    return (
      <>
        <HashChip
          className={clsx(styles.hashChip, 'mr-1')}
          hash={actor.address}
          rounded="base"
          testID={ActivitySelectors.addressFromDetailsButton}
        />
        <OpenInExplorerChip hash={actor.address} testID={ActivitySelectors.openAddressInExplorerButton} />
      </>
    );
  }

  return (
    <AddressChip
      pkh={actor.address}
      testID={ActivitySelectors.addressFromDetailsButton}
      modeSwitch={{ testID: ActivitySelectors.addressModeSwitchButton }}
      rounded="base"
      chipClassName={styles.hashChip}
    />
  );
};
