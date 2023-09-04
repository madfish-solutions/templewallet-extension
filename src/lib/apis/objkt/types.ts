export interface TzProfile {
  alias?: string;
  discord?: string;
  github?: string;
  logo?: string;
  twitter?: string;
  tzdomain?: string;
  website?: string;
}
export interface TzProfilesQueryResponse {
  holder_by_pk: TzProfile;
}
