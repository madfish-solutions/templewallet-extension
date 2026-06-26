import { FC, ReactNode } from 'react';

import { IconBase } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import PageLayout from 'app/layouts/PageLayout';
import { useContentPaperRef } from 'app/layouts/PageLayout/context';
import { T, TID } from 'lib/i18n';
import { StyledButtonColor } from 'lib/ui/use-styled-button-or-link-props';

export interface EarnPromoAdvantageItem {
  Icon: ImportedSVGComponent;
  textI18nKey: TID;
}

interface EarnPromoLayoutProps {
  pageTitle: ReactNode;
  TopVisual: ReactNode;
  headline: ReactNode;
  advantages: EarnPromoAdvantageItem[];
  advantageIconClassName?: string;
  disclaimer?: ReactNode;
  actionText: ReactNode;
  actionColor: StyledButtonColor;
  actionDisabled?: boolean;
  onActionClick?: EmptyFn;
  actionTestID?: string;
}

export const EarnPromoLayout: FC<EarnPromoLayoutProps> = ({
  pageTitle,
  TopVisual,
  headline,
  advantages,
  advantageIconClassName,
  disclaimer,
  actionText,
  actionColor,
  actionDisabled,
  onActionClick,
  actionTestID
}) => {
  return (
    <PageLayout pageTitle={pageTitle} contentPadding={false} contentClassName="bg-white!">
      <div className="flex-1 px-4">
        <div className="flex justify-center">{TopVisual}</div>

        <h3 className="text-font-h3 text-center pb-4">{headline}</h3>

        <div className="grid grid-cols-2 gap-3 pb-5">
          {advantages.map((item, index) => (
            <div key={index} className="flex flex-col p-3 bg-grey-4 rounded-8">
              {item.Icon && <IconBase Icon={item.Icon} className={advantageIconClassName} />}
              <p className="text-font-description p-1">
                <T id={item.textI18nKey} />
              </p>
            </div>
          ))}
        </div>

        {disclaimer && <p className="text-font-small text-grey-1 text-center pb-8">{disclaimer}</p>}
      </div>

      <EarnPromoActionsButtonsBox>
        <StyledButton
          size="L"
          color={actionColor}
          disabled={actionDisabled}
          onClick={onActionClick}
          testID={actionTestID}
        >
          {actionText}
        </StyledButton>
      </EarnPromoActionsButtonsBox>
    </PageLayout>
  );
};

const EarnPromoActionsButtonsBox: FC<PropsWithChildren> = ({ children }) => {
  const scrollContainerRef = useContentPaperRef();

  return (
    <ActionsButtonsBox className="sticky left-0 bottom-0" scrollContainerRef={scrollContainerRef}>
      {children}
    </ActionsButtonsBox>
  );
};
