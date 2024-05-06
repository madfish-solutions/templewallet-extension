import React, { memo } from 'react';

import { IconBase } from 'app/atoms';
import { ACTIONS_DROPDOWN_ITEM_CLASSNAME } from 'app/atoms/ActionsDropdown';
import { Button } from 'app/atoms/Button';
import { TID, T } from 'lib/i18n';
import { Link } from 'lib/woozie';

export interface ActionButtonProps {
  Icon: ImportedSVGComponent;
  i18nKey: TID;
  linkTo: string | null;
  onClick: EmptyFn;
  testID: string;
}

export const ActionButton = memo<ActionButtonProps>(({ Icon, linkTo, onClick, i18nKey, testID }) => {
  const baseProps = {
    testID,
    className: ACTIONS_DROPDOWN_ITEM_CLASSNAME,
    onClick,
    children: (
      <>
        <IconBase Icon={Icon} size={16} className="text-secondary" />

        <T id={i18nKey} />
      </>
    )
  };

  return linkTo ? <Link {...baseProps} to={linkTo} /> : <Button {...baseProps} />;
});
