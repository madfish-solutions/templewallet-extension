import { TestIDProps } from './test-id.props';

export const setTestID = (testID: TestIDProps['testID']) => ({ 'data-testid': testID });

export const setAnotherSelector = (name: string, value?: string | number) => ({ [`data-${name}`]: value });
