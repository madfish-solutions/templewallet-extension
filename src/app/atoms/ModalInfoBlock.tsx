import React, { memo, ReactNode } from 'react';

import clsx from 'clsx';

import { IconBase } from './IconBase';

interface ModalInfoBlockProps {
  Icon: ImportedSVGComponent;
  headline: ReactNode;
  description: ReactNode;
  onClick?: EmptyFn;
  className?: string;
}

export const ModalInfoBlock = memo<ModalInfoBlockProps>(({ Icon, headline, description, className, onClick }) => {
  return (
    <button
      className={clsx(
        className,
        'flex gap-3 p-4 bg-white hover:bg-background rounded-lg border-0.5 border-lines group'
      )}
      onClick={onClick}
    >
      <div className="rounded-full p-3 bg-primary-low text-primary group-hover:bg-primary-hover-low group-hover:text-primary-hover">
        <IconBase Icon={Icon} size={32} className="text-primary" />
      </div>

      <div className="flex flex-col gap-1 flex-1 h-full text-left justify-center">
        <span className="text-black text-font-medium-bold">{headline}</span>
        <span className="text-grey-1 text-font-description">{description}</span>
      </div>
    </button>
  );
});
