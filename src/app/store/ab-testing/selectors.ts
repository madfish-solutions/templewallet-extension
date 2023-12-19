import { useSelector } from '../root-state.selector';

export const useUserTestingGroupNameSelector = () => useSelector(({ abTesting }) => abTesting.groupName);
