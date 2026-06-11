import { FC } from 'react';

import clsx from 'clsx';

import { AnimatedMenuChevron } from 'app/atoms/animated-menu-chevron';
import { useActivateAnimatedChevron } from 'lib/ui/hooks/use-activate-animated-chevron';
import { Link } from 'lib/woozie';

interface CardWithChevronProps extends PropsWithChildren {
  className?: string;
  cardContentClassName?: string;
  title: ReactChildren;
  linkTo: string;
  testID?: string;
  wholeCardIsLink?: boolean;
}

export const CardWithChevron: FC<CardWithChevronProps> = ({
  className,
  cardContentClassName,
  title,
  linkTo,
  testID,
  children,
  wholeCardIsLink
}) => {
  const {
    animatedChevronRef: animatedTokensChevronRef,
    handleHover: handleTokensHover,
    handleUnhover: handleTokensUnhover
  } = useActivateAnimatedChevron();

  const headerContent = (
    <>
      {title}
      <AnimatedMenuChevron ref={animatedTokensChevronRef} />
    </>
  );

  const cardContent = (
    <div className={clsx('flex flex-col bg-background rounded-8', cardContentClassName)}>{children}</div>
  );

  if (wholeCardIsLink) {
    return (
      <Link
        to={linkTo}
        className={clsx('bg-white rounded-8 border-0.5 border-lines p-1 pt-0 flex flex-col', className)}
        onMouseEnter={handleTokensHover}
        onMouseLeave={handleTokensUnhover}
        testID={testID}
      >
        <div className="flex justify-between items-center p-2 gap-1">{headerContent}</div>

        {cardContent}
      </Link>
    );
  }

  return (
    <div
      className={clsx('bg-white rounded-8 border-0.5 border-lines p-1 pt-0 flex flex-col', className)}
      onMouseEnter={handleTokensHover}
      onMouseLeave={handleTokensUnhover}
    >
      <Link to={linkTo} className="flex justify-between items-center p-2 gap-1" testID={testID}>
        {headerContent}
      </Link>

      {cardContent}
    </div>
  );
};
