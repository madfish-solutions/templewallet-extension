import React, { memo } from 'react';

import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { InputContainer } from 'app/templates/InputContainer/InputContainer';

import { LinkProps, LinksGroupItem } from './links-group-item';

interface LinksGroup {
  title: string;
  links: LinkProps[];
}

interface LinksGroupViewProps {
  className?: string;
  group: LinksGroup;
}

export const LinksGroupView = memo<LinksGroupViewProps>(({ className, group }) => {
  const { title, links } = group;

  return (
    <InputContainer className={className} header={<p className="my-1 text-font-description-bold">{title}</p>}>
      <SettingsCellGroup>
        {links.map((link, i) => (
          <LinksGroupItem key={link.key} item={link} isLast={i === links.length - 1} />
        ))}
      </SettingsCellGroup>
    </InputContainer>
  );
});
