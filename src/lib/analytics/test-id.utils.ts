import { TestIDProps } from './test-id.props';

export const setTestID = (testID?: TestIDProps['testID']) => ({ 'data-testid': testID });
