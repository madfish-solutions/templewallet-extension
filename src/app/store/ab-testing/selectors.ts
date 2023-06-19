import { useSelector } from '../index';

export const useUserTestingGroupNameSelector = () => useSelector(({ abTesting }) => abTesting.groupName);
