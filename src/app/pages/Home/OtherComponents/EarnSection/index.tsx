import React, { memo } from 'react';

import clsx from 'clsx';

import { KoloCryptoCardPreview } from 'app/pages/Home/OtherComponents/KoloCard/KoloCryptoCardPreview';
import { EarnDepositStats } from 'app/templates/EarnDepositStats';
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
        className="relative -mb-[68px] px-4 transform transition-transform duration-200 ease-out peer-hover:translate-y-2"
        onMouseEnter={handleHover}
        onMouseLeave={handleUnhover}
        testID={HomeSelectors.earnSectionCard}
      >
        <EarnDepositStats isHomePage animatedChevronRef={animatedChevronRef} />
      </Link>
    </div>
  );
});
