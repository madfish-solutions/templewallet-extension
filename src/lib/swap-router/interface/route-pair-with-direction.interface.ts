import { RoutePair } from '../backend/interfaces/route-pair.interface';
import { RouteDirectionEnum } from '../enum/route-direction.enum';

export interface RoutePairWithDirection extends RoutePair {
  direction: RouteDirectionEnum;
}
