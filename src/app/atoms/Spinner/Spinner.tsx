import React, { HTMLAttributes, memo } from 'react';

import classNames from 'clsx';

import styles from './Spinner.module.css';

type SpinnerProps = HTMLAttributes<HTMLDivElement> & {
  theme?: 'primary' | 'white' | 'gray' | 'dark-gray';
};

const Spinner = memo<SpinnerProps>(({ theme = 'primary', className, ...rest }) => (
  <div className={classNames('flex justify-around', className)} {...rest}>
    {['bounce1', 'bounce2', 'bounce3'].map(name => (
      <div
        key={name}
        className={classNames(
          'w-1/4',
          'rounded-full',
          (() => {
            switch (theme) {
              case 'primary':
                return 'bg-primary-orange';

              case 'white':
                return 'bg-white shadow-sm';

              case 'dark-gray':
                return 'bg-gray-600';

              case 'gray':
              default:
                return 'bg-gray-400';
            }
          })(),
          styles['bounce'],
          styles[name]
        )}
      >
        <div className="pb-full" />
      </div>
    ))}
  </div>
));

export default Spinner;
