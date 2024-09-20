import { ReactNode, SetStateAction } from 'react';

export interface SettingsTabProps {
  setHeaderChildren: React.Dispatch<SetStateAction<ReactNode>>;
}
