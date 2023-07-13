import React, { FC } from 'react';

interface Props {
  className?: string;
  color: string;
  size: number;
}

export const RevealEye: FC<Props> = ({ className, size = 32, color }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    width={size}
    height={size}
    fill="none"
  >
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18.827 18.827a4.002 4.002 0 0 1-6.636-1.23 4 4 0 0 1 .982-4.424M23.92 23.92A13.427 13.427 0 0 1 16 26.667C6.667 26.667 1.334 16 1.334 16A24.6 24.6 0 0 1 8.08 8.08l15.84 15.84ZM13.2 5.653a12.159 12.159 0 0 1 2.8-.32C25.334 5.333 30.667 16 30.667 16a24.666 24.666 0 0 1-2.88 4.253L13.2 5.653ZM1.333 1.333l29.334 29.334"
    />
  </svg>
);
