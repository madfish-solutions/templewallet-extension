import React, { memo } from 'react';

import clsx from 'clsx';

import { AnimatedMenuChevron } from 'app/atoms/animated-menu-chevron';
import { KoloCryptoCardPreview } from 'app/pages/Home/OtherComponents/KoloCard/KoloCryptoCardPreview';
import { EarnDepositStats } from 'app/templates/EarnDepositStats';
import { T } from 'lib/i18n';
import { useActivateAnimatedChevron } from 'lib/ui/hooks/use-activate-animated-chevron';
import { Link } from 'lib/woozie';

import { HomeSelectors } from '../../selectors';

interface EarnSectionProps {
  className?: string;
  openCryptoCardModal: EmptyFn;
}

export const EarnSection = memo<EarnSectionProps>(({ className, openCryptoCardModal }) => {
  const { animatedChevronRef, handleHover, handleUnhover } = useActivateAnimatedChevron();

  return (
    <div className={clsx('flex flex-col relative pb-[68px]', className)}>
      <KoloCryptoCardPreview onClick={openCryptoCardModal} />

      <Link
        to="/earn"
        className={
          'relative -mb-[68px] px-4 transform transition-transform duration-200 ease-out peer-hover:translate-y-2'
        }
        onMouseEnter={handleHover}
        onMouseLeave={handleUnhover}
        testID={HomeSelectors.earnSectionCard}
      >
        <div className="flex flex-col rounded-8 pb-1 px-1 border-0.5 border-lines bg-white">
          <div className="flex items-center justify-between p-2 rounded-8 overflow-hidden">
            <span className="text-font-description-bold p-1">
              <T id="earn" />
            </span>
            <AnimatedMenuChevron ref={animatedChevronRef} />
          </div>

          <div className="rounded-8 p-3 pb-2 bg-background">
            <EarnDepositStats isHomePage />
          </div>
        </div>
      </Link>
    </div>
  );
});
