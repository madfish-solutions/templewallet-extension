import { RouteDirectionEnum } from '../enum/route-direction.enum';
import { RoutePair } from './route-pair.interface';

export interface RoutePairWithDirection extends RoutePair {
  direction: RouteDirectionEnum;
}
