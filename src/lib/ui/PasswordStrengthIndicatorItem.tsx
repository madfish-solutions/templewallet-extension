import React, { FC, ReactNode } from 'react';

interface PasswordStrengthIndicatorItemProps {
  isValid: boolean;
  message: ReactNode;
  title?: boolean;
  noColor?: boolean;
}

const PasswordStrengthIndicatorItem: FC<PasswordStrengthIndicatorItemProps> = ({
  isValid,
  message,
  title = false,
  noColor = false
}) => {
  const style = isValid ? { color: '#48bb78' } : noColor ? {} : { color: '#e53e3e' };

  return title ? <p style={style}>{message}</p> : <li style={style}>{message}</li>;
};

export default PasswordStrengthIndicatorItem;
