import * as React from 'react';

import Spinner from './Spinner/Spinner';

interface ActivitySpinnerProps {
  height?: string;
}

export const ActivitySpinner: React.FC<ActivitySpinnerProps> = ({ height = '21px' }) => (
  <div className="w-full flex items-center justify-center overflow-hidden" style={{ height }}>
    <Spinner theme="gray" className="w-16" />
  </div>
);
