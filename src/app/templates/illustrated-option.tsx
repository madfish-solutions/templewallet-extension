import React, { FC, HTMLAttributes } from 'react';

import clsx from 'clsx';

import { T, TID } from 'lib/i18n';

interface ComponentBase {
  className?: string;
  testID?: string;
  children?: ReactChildren;
}

interface IllustratedOptionPropsBase<P extends ComponentBase = ComponentBase> {
  // 'button' option is not going to be used but it fixes an error of substitution with FC<P>
  Component: 'button' | FC<Omit<P, Exclude<keyof IllustratedOptionPropsBase<P>, 'testID'>>>;
  title: ReactChildren;
  descriptionI18nKey: TID;
  testID?: string;
  IllustrationAsset: string | ImportedSVGComponent;
}

type AcceptableComponentProps<P extends ComponentBase> = Omit<
  P,
  Exclude<keyof IllustratedOptionPropsBase<P>, 'testID'>
>;

interface ButtonIllustratedOptionProps
  extends AcceptableComponentProps<HTMLAttributes<HTMLButtonElement>>,
    IllustratedOptionPropsBase {
  Component: 'button';
}

type FCIllustratedOptionProps<P extends ComponentBase> = AcceptableComponentProps<P> &
  IllustratedOptionPropsBase<P> & { Component: FC<AcceptableComponentProps<P>> };

type IllustratedOptionProps<P extends ComponentBase> = P extends { Component: 'button' }
  ? ButtonIllustratedOptionProps
  : FCIllustratedOptionProps<P>;

export const IllustratedOption = <P extends ComponentBase>({
  Component,
  title,
  descriptionI18nKey,
  testID,
  IllustrationAsset,
  className,
  ...restProps
}: IllustratedOptionProps<P>) => (
  <Component
    className={clsx(className, 'flex items-center gap-2 p-4 rounded-lg hover:bg-grey-4 border-0.5 border-lines')}
    testID={testID}
    {...restProps}
  >
    {typeof IllustrationAsset === 'string' ? (
      <img src={IllustrationAsset} alt="" className="w-14 h-auto" />
    ) : (
      <IllustrationAsset className="w-14 h-auto" />
    )}
    <div className="flex-1 flex flex-col gap-1 text-left">
      <div className="text-font-medium-bold text-black">{title}</div>
      <p className="text-font-description text-grey-1">
        <T id={descriptionI18nKey} />
      </p>
    </div>
  </Component>
);
