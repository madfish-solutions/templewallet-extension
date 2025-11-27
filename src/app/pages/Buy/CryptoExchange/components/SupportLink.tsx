import React, { memo } from 'react';

import clsx from 'clsx';

import { Anchor, IconBase } from 'app/atoms';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { T } from 'lib/i18n';

import { EXOLIX_CONTACT_LINK } from '../config';

interface Props {
  className?: string;
}

export const SupportLink = memo<Props>(({ className }) => (
  <Anchor href={EXOLIX_CONTACT_LINK} className={clsx('py-0.5 flex flex-row justify-center items-center', className)}>
    <span className="text-font-description-bold text-secondary">
      <T id="exolixSupport" />
    </span>
    <IconBase size={16} className="text-secondary" Icon={OutLinkIcon} />
  </Anchor>
));
