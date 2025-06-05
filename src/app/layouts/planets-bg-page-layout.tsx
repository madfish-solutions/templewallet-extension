import React, { FC } from 'react';

import clsx from 'clsx';

import { useResizeDependentValue } from 'app/hooks/use-resize-dependent-value';
import { PlanetsAnimation, SUN_RADIUS } from 'app/templates/planets-animation';
import { NullComponent } from 'lib/ui/null-component';

import PageLayout from './PageLayout';

interface PlanetsBgPageLayoutProps {
  showTestnetModeIndicator?: boolean;
  containerClassName?: string;
}

const MIN_BOTTOM_GAP = 88;

const getAnimationBottomGap = (bottomGapElement: HTMLDivElement) =>
  bottomGapElement.getBoundingClientRect().height - SUN_RADIUS;

export const PlanetsBgPageLayout: FC<PropsWithChildren<PlanetsBgPageLayoutProps>> = ({
  children,
  showTestnetModeIndicator,
  containerClassName
}) => {
  const { value: bottomGap, refFn: bottomGapElementRef } = useResizeDependentValue<number, HTMLDivElement>(
    getAnimationBottomGap,
    MIN_BOTTOM_GAP,
    100
  );

  return (
    <PageLayout
      Header={NullComponent}
      contentPadding={false}
      contentClassName="relative"
      showTestnetModeIndicator={showTestnetModeIndicator}
    >
      <PlanetsAnimation bottomGap={bottomGap} />
      <div className={clsx('w-full min-h-full p-4 flex flex-col z-1', containerClassName)}>
        <div className="w-full aspect-[2]" />
        <div className="w-full flex-1" ref={bottomGapElementRef} style={{ minHeight: SUN_RADIUS + MIN_BOTTOM_GAP }} />
        {children}
      </div>
    </PageLayout>
  );
};
