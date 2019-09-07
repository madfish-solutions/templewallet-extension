import useHistory from "./useHistory";
import { createLocationState, LocationState } from "./state";

export default function useLocation(): LocationState {
  useHistory();
  return createLocationState();
}
