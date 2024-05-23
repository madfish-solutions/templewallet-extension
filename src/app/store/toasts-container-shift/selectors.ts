import { useSelector } from '../root-state.selector';

export const useToastsContainerBottomShiftSelector = () =>
  useSelector(({ toastsContainerShift }) => toastsContainerShift.bottomShift);
