import React, { memo } from 'react';

import { Anchor, IconBase } from 'app/atoms';
import { SettingsCell } from 'app/atoms/SettingsCell';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { TID, t } from 'lib/i18n';

export interface LinkProps {
  key: TID;
  link: string;
  testID: string;
  Icon?: ImportedSVGComponent;
}

interface LinksGroupItemProps {
  item: LinkProps;
  isLast: boolean;
}

export const LinksGroupItem = memo<LinksGroupItemProps>(({ item, isLast }) => {
  const { Icon, key, link, testID } = item;

  return (
    <SettingsCell
      isLast={isLast}
      cellIcon={Icon && <Icon />}
      cellName={t(key)}
      Component={Anchor}
      href={link}
      testID={testID}
    >
      <IconBase size={16} className="text-primary" Icon={OutLinkIcon} />
    </SettingsCell>
  );
});
