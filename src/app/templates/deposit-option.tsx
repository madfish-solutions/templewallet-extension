import React, { memo } from 'react';

import clsx from 'clsx';

import { ReactComponent as ApplePayIcon } from 'app/icons/payment-options/apple-pay-no-frame.svg';
import { ReactComponent as MastercardIcon } from 'app/icons/payment-options/mastercard.svg';
import { ReactComponent as VisaIcon } from 'app/icons/payment-options/visa.svg';
import { TestIDProperty } from 'lib/analytics';
import { Link, To } from 'lib/woozie';

interface DepositOptionProps extends TestIDProperty {
  to: To;
  imageSrc: string;
  title: string;
  description: string;
  paymentIcons?: boolean;
  className?: string;
}

const fiatOptionsIcons = [MastercardIcon, VisaIcon, ApplePayIcon];

export const DepositOption = memo<DepositOptionProps>(
  ({ to, imageSrc, title, description, paymentIcons, className, testID }) => (
    <Link
      className={clsx(
        'flex items-center gap-2 p-4 rounded-lg bg-white hover:bg-grey-4 border-0.5 border-lines',
        className
      )}
      to={to}
      testID={testID}
    >
      <img src={imageSrc} alt="" className="w-14 h-14 object-contain" />

      <div className="flex-1 flex flex-col gap-1 text-left">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-font-medium-bold text-black">{title}</span>
          {paymentIcons && (
            <div className="flex gap-1 items-center">
              {fiatOptionsIcons.map((Icon, index) => (
                <div
                  className="w-[29px] h-5 px-1 flex items-center justify-center border-0.5 border-lines rounded"
                  key={index}
                >
                  <Icon />
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-font-description text-grey-1">{description}</p>
      </div>
    </Link>
  )
);
