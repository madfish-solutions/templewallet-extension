import { FC, ReactNode } from 'react';

import { Anchor, Button, IconBase } from 'app/atoms';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { ReactComponent as InfoFillIcon } from 'app/icons/base/InfoFill.svg';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';

interface CellCopyProps {
  title: ReactNode;
  titleHint?: string;
  titleBold?: boolean;
  description: ReactNode;
}

const CellCopy: FC<CellCopyProps> = ({ title, titleHint, titleBold = true, description }) => (
  <div className="flex flex-col flex-1 min-w-0">
    <p>
      <span className={titleBold ? 'text-font-description-bold' : 'text-font-description'}>
        {title}
        {titleHint ? ' ' : null}
      </span>
      {titleHint && <span className="text-font-small text-grey-1">{titleHint}</span>}
    </p>
    <p className="text-font-small text-grey-1">{description}</p>
  </div>
);

interface SurfaceCellProps extends CellCopyProps {
  isLast?: boolean;
  children?: ReactNode;
}

export const SurfaceCell: FC<SurfaceCellProps> = ({ isLast = true, children, ...copyProps }) => (
  <SettingsCellSingle Component="div" isLast={isLast} wrapCellName={false} cellName={<CellCopy {...copyProps} />}>
    {children}
  </SettingsCellSingle>
);

interface InfoButtonProps {
  onClick: EmptyFn;
  testID: string;
}

export const InfoButton: FC<InfoButtonProps> = ({ onClick, testID }) => (
  <Button onClick={onClick} testID={testID}>
    <IconBase Icon={InfoFillIcon} className="text-grey-2" />
  </Button>
);

interface PrivacyCellProps {
  title: ReactNode;
  description: ReactNode;
  href: string;
  testID: string;
  isLast?: boolean;
}

export const PrivacyCell: FC<PrivacyCellProps> = ({ title, description, href, testID, isLast = true }) => (
  <SettingsCellSingle
    Component={Anchor}
    href={href}
    testID={testID}
    isLast={isLast}
    wrapCellName={false}
    cellName={<CellCopy title={title} titleBold={false} description={description} />}
  >
    <IconBase Icon={OutLinkIcon} className="text-secondary" />
  </SettingsCellSingle>
);
