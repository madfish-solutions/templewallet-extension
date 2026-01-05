import React, { ComponentType } from 'react';

import { SuspenseContainer, SuspenseContainerProps } from 'app/atoms/SuspenseContainer';

export const withSuspense =
  <T extends object>(Component: ComponentType<T>, suspenseContainerProps: Omit<SuspenseContainerProps, 'children'>) =>
  (props: T) =>
    (
      <SuspenseContainer {...suspenseContainerProps}>
        <Component {...props} />
      </SuspenseContainer>
    );
