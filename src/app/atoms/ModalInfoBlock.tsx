import React, { memo, ReactNode } from 'react';

import clsx from 'clsx';

import { useBooleanState } from 'lib/ui/hooks';

import { IconBase } from './IconBase';

interface ModalInfoBlockProps {
  Icon: ImportedSVGComponent;
  headline: ReactNode;
  description: ReactNode;
  onClick?: EmptyFn;
  className?: string;
}

export const ModalInfoBlock = memo<ModalInfoBlockProps>(({ Icon, headline, description, className, onClick }) => {
  const [isHovered, handleMouseEnter, handleMouseLeave] = useBooleanState(false);

  return (
    <button
      className={clsx(
        className,
        'flex gap-3 p-4 bg-white rounded-lg shadow-center border',
        isHovered && 'border-lines'
      )}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={clsx(
          'rounded-full p-3',
          isHovered ? 'bg-primary-hover-low text-primary-hover' : 'bg-primary-low text-primary'
        )}
      >
        <IconBase Icon={Icon} size={32} className="text-primary" />
      </div>

      <div className="flex flex-col gap-1 flex-1 h-full text-left justify-center">
        <span className="text-black text-font-medium-bold">{headline}</span>
        <span className="text-grey-1 text-font-description">{description}</span>
      </div>
    </button>
  );
});
