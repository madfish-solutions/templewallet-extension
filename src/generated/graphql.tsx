import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  bigint: any;
  jsonb: any;
  timestamptz: any;
};

/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
export type Boolean_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Boolean']>;
  _gt?: InputMaybe<Scalars['Boolean']>;
  _gte?: InputMaybe<Scalars['Boolean']>;
  _in?: InputMaybe<Array<Scalars['Boolean']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['Boolean']>;
  _lte?: InputMaybe<Scalars['Boolean']>;
  _neq?: InputMaybe<Scalars['Boolean']>;
  _nin?: InputMaybe<Array<Scalars['Boolean']>>;
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['String']>;
  _gt?: InputMaybe<Scalars['String']>;
  _gte?: InputMaybe<Scalars['String']>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars['String']>;
  _in?: InputMaybe<Array<Scalars['String']>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars['String']>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars['String']>;
  _lt?: InputMaybe<Scalars['String']>;
  _lte?: InputMaybe<Scalars['String']>;
  _neq?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars['String']>;
  _nin?: InputMaybe<Array<Scalars['String']>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars['String']>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars['String']>;
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars['String']>;
};

/** Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'. */
export type Bigint_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['bigint']>;
  _gt?: InputMaybe<Scalars['bigint']>;
  _gte?: InputMaybe<Scalars['bigint']>;
  _in?: InputMaybe<Array<Scalars['bigint']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['bigint']>;
  _lte?: InputMaybe<Scalars['bigint']>;
  _neq?: InputMaybe<Scalars['bigint']>;
  _nin?: InputMaybe<Array<Scalars['bigint']>>;
};

/** columns and relationships of "events" */
export type Events = {
  __typename?: 'events';
  amount?: Maybe<Scalars['bigint']>;
  artist_address?: Maybe<Scalars['String']>;
  /** An object relationship */
  artist_profile?: Maybe<Tzprofiles>;
  ask_id?: Maybe<Scalars['bigint']>;
  auction_id?: Maybe<Scalars['bigint']>;
  bid?: Maybe<Scalars['bigint']>;
  bid_id?: Maybe<Scalars['bigint']>;
  bidder_address?: Maybe<Scalars['String']>;
  /** An object relationship */
  bidder_profile?: Maybe<Tzprofiles>;
  burn_on_end?: Maybe<Scalars['Boolean']>;
  buyer_address?: Maybe<Scalars['String']>;
  /** An object relationship */
  buyer_profile?: Maybe<Tzprofiles>;
  collection_id?: Maybe<Scalars['bigint']>;
  creator_name?: Maybe<Scalars['String']>;
  currency?: Maybe<Scalars['String']>;
  current_price?: Maybe<Scalars['bigint']>;
  editions?: Maybe<Scalars['bigint']>;
  eightscribo_rowone?: Maybe<Scalars['String']>;
  eightscribo_rowthree?: Maybe<Scalars['String']>;
  eightscribo_rowtwo?: Maybe<Scalars['String']>;
  eightscribo_title?: Maybe<Scalars['String']>;
  end_price?: Maybe<Scalars['bigint']>;
  end_time?: Maybe<Scalars['timestamptz']>;
  extension_time?: Maybe<Scalars['bigint']>;
  fa2_address?: Maybe<Scalars['String']>;
  from_address?: Maybe<Scalars['String']>;
  /** An object relationship */
  from_profile?: Maybe<Tzprofiles>;
  highest_bidder_address?: Maybe<Scalars['String']>;
  /** An object relationship */
  highest_bidder_profile?: Maybe<Tzprofiles>;
  holder_address?: Maybe<Scalars['String']>;
  /** An object relationship */
  holder_profile?: Maybe<Tzprofiles>;
  id: Scalars['String'];
  implements?: Maybe<Scalars['String']>;
  is_mint?: Maybe<Scalars['Boolean']>;
  issuer_id?: Maybe<Scalars['bigint']>;
  iteration?: Maybe<Scalars['bigint']>;
  level: Scalars['bigint'];
  metadata_uri?: Maybe<Scalars['String']>;
  offer_id?: Maybe<Scalars['bigint']>;
  ophash?: Maybe<Scalars['String']>;
  opid: Scalars['bigint'];
  owner_address?: Maybe<Scalars['String']>;
  /** An object relationship */
  owner_profile?: Maybe<Tzprofiles>;
  price?: Maybe<Scalars['bigint']>;
  price_increment?: Maybe<Scalars['bigint']>;
  reserve?: Maybe<Scalars['bigint']>;
  rgb?: Maybe<Scalars['String']>;
  royalties?: Maybe<Scalars['bigint']>;
  royalty_shares?: Maybe<Scalars['jsonb']>;
  seller_address?: Maybe<Scalars['String']>;
  /** An object relationship */
  seller_profile?: Maybe<Tzprofiles>;
  start_price?: Maybe<Scalars['bigint']>;
  start_time?: Maybe<Scalars['timestamptz']>;
  swap_id?: Maybe<Scalars['bigint']>;
  timestamp: Scalars['timestamptz'];
  to_address?: Maybe<Scalars['String']>;
  /** An object relationship */
  to_profile?: Maybe<Tzprofiles>;
  /** An object relationship */
  token?: Maybe<Tokens>;
  token_description?: Maybe<Scalars['String']>;
  token_id?: Maybe<Scalars['String']>;
  token_name?: Maybe<Scalars['String']>;
  total_price?: Maybe<Scalars['bigint']>;
  type?: Maybe<Scalars['String']>;
};

/** columns and relationships of "events" */
export type EventsRoyalty_SharesArgs = {
  path?: InputMaybe<Scalars['String']>;
};

/** aggregated selection of "events" */
export type Events_Aggregate = {
  __typename?: 'events_aggregate';
  aggregate?: Maybe<Events_Aggregate_Fields>;
  nodes: Array<Events>;
};

/** aggregate fields of "events" */
export type Events_Aggregate_Fields = {
  __typename?: 'events_aggregate_fields';
  avg?: Maybe<Events_Avg_Fields>;
  count: Scalars['Int'];
  max?: Maybe<Events_Max_Fields>;
  min?: Maybe<Events_Min_Fields>;
  stddev?: Maybe<Events_Stddev_Fields>;
  stddev_pop?: Maybe<Events_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Events_Stddev_Samp_Fields>;
  sum?: Maybe<Events_Sum_Fields>;
  var_pop?: Maybe<Events_Var_Pop_Fields>;
  var_samp?: Maybe<Events_Var_Samp_Fields>;
  variance?: Maybe<Events_Variance_Fields>;
};

/** aggregate fields of "events" */
export type Events_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Events_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "events" */
export type Events_Aggregate_Order_By = {
  avg?: InputMaybe<Events_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Events_Max_Order_By>;
  min?: InputMaybe<Events_Min_Order_By>;
  stddev?: InputMaybe<Events_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Events_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Events_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Events_Sum_Order_By>;
  var_pop?: InputMaybe<Events_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Events_Var_Samp_Order_By>;
  variance?: InputMaybe<Events_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Events_Avg_Fields = {
  __typename?: 'events_avg_fields';
  amount?: Maybe<Scalars['Float']>;
  ask_id?: Maybe<Scalars['Float']>;
  auction_id?: Maybe<Scalars['Float']>;
  bid?: Maybe<Scalars['Float']>;
  bid_id?: Maybe<Scalars['Float']>;
  collection_id?: Maybe<Scalars['Float']>;
  current_price?: Maybe<Scalars['Float']>;
  editions?: Maybe<Scalars['Float']>;
  end_price?: Maybe<Scalars['Float']>;
  extension_time?: Maybe<Scalars['Float']>;
  issuer_id?: Maybe<Scalars['Float']>;
  iteration?: Maybe<Scalars['Float']>;
  level?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  opid?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  price_increment?: Maybe<Scalars['Float']>;
  reserve?: Maybe<Scalars['Float']>;
  royalties?: Maybe<Scalars['Float']>;
  start_price?: Maybe<Scalars['Float']>;
  swap_id?: Maybe<Scalars['Float']>;
  total_price?: Maybe<Scalars['Float']>;
};

/** order by avg() on columns of table "events" */
export type Events_Avg_Order_By = {
  amount?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  auction_id?: InputMaybe<Order_By>;
  bid?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  collection_id?: InputMaybe<Order_By>;
  current_price?: InputMaybe<Order_By>;
  editions?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  extension_time?: InputMaybe<Order_By>;
  issuer_id?: InputMaybe<Order_By>;
  iteration?: InputMaybe<Order_By>;
  level?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  opid?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  price_increment?: InputMaybe<Order_By>;
  reserve?: InputMaybe<Order_By>;
  royalties?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
  total_price?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "events". All fields are combined with a logical 'AND'. */
export type Events_Bool_Exp = {
  _and?: InputMaybe<Array<Events_Bool_Exp>>;
  _not?: InputMaybe<Events_Bool_Exp>;
  _or?: InputMaybe<Array<Events_Bool_Exp>>;
  amount?: InputMaybe<Bigint_Comparison_Exp>;
  artist_address?: InputMaybe<String_Comparison_Exp>;
  artist_profile?: InputMaybe<Tzprofiles_Bool_Exp>;
  ask_id?: InputMaybe<Bigint_Comparison_Exp>;
  auction_id?: InputMaybe<Bigint_Comparison_Exp>;
  bid?: InputMaybe<Bigint_Comparison_Exp>;
  bid_id?: InputMaybe<Bigint_Comparison_Exp>;
  bidder_address?: InputMaybe<String_Comparison_Exp>;
  bidder_profile?: InputMaybe<Tzprofiles_Bool_Exp>;
  burn_on_end?: InputMaybe<Boolean_Comparison_Exp>;
  buyer_address?: InputMaybe<String_Comparison_Exp>;
  buyer_profile?: InputMaybe<Tzprofiles_Bool_Exp>;
  collection_id?: InputMaybe<Bigint_Comparison_Exp>;
  creator_name?: InputMaybe<String_Comparison_Exp>;
  currency?: InputMaybe<String_Comparison_Exp>;
  current_price?: InputMaybe<Bigint_Comparison_Exp>;
  editions?: InputMaybe<Bigint_Comparison_Exp>;
  eightscribo_rowone?: InputMaybe<String_Comparison_Exp>;
  eightscribo_rowthree?: InputMaybe<String_Comparison_Exp>;
  eightscribo_rowtwo?: InputMaybe<String_Comparison_Exp>;
  eightscribo_title?: InputMaybe<String_Comparison_Exp>;
  end_price?: InputMaybe<Bigint_Comparison_Exp>;
  end_time?: InputMaybe<Timestamptz_Comparison_Exp>;
  extension_time?: InputMaybe<Bigint_Comparison_Exp>;
  fa2_address?: InputMaybe<String_Comparison_Exp>;
  from_address?: InputMaybe<String_Comparison_Exp>;
  from_profile?: InputMaybe<Tzprofiles_Bool_Exp>;
  highest_bidder_address?: InputMaybe<String_Comparison_Exp>;
  highest_bidder_profile?: InputMaybe<Tzprofiles_Bool_Exp>;
  holder_address?: InputMaybe<String_Comparison_Exp>;
  holder_profile?: InputMaybe<Tzprofiles_Bool_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  implements?: InputMaybe<String_Comparison_Exp>;
  is_mint?: InputMaybe<Boolean_Comparison_Exp>;
  issuer_id?: InputMaybe<Bigint_Comparison_Exp>;
  iteration?: InputMaybe<Bigint_Comparison_Exp>;
  level?: InputMaybe<Bigint_Comparison_Exp>;
  metadata_uri?: InputMaybe<String_Comparison_Exp>;
  offer_id?: InputMaybe<Bigint_Comparison_Exp>;
  ophash?: InputMaybe<String_Comparison_Exp>;
  opid?: InputMaybe<Bigint_Comparison_Exp>;
  owner_address?: InputMaybe<String_Comparison_Exp>;
  owner_profile?: InputMaybe<Tzprofiles_Bool_Exp>;
  price?: InputMaybe<Bigint_Comparison_Exp>;
  price_increment?: InputMaybe<Bigint_Comparison_Exp>;
  reserve?: InputMaybe<Bigint_Comparison_Exp>;
  rgb?: InputMaybe<String_Comparison_Exp>;
  royalties?: InputMaybe<Bigint_Comparison_Exp>;
  royalty_shares?: InputMaybe<Jsonb_Comparison_Exp>;
  seller_address?: InputMaybe<String_Comparison_Exp>;
  seller_profile?: InputMaybe<Tzprofiles_Bool_Exp>;
  start_price?: InputMaybe<Bigint_Comparison_Exp>;
  start_time?: InputMaybe<Timestamptz_Comparison_Exp>;
  swap_id?: InputMaybe<Bigint_Comparison_Exp>;
  timestamp?: InputMaybe<Timestamptz_Comparison_Exp>;
  to_address?: InputMaybe<String_Comparison_Exp>;
  to_profile?: InputMaybe<Tzprofiles_Bool_Exp>;
  token?: InputMaybe<Tokens_Bool_Exp>;
  token_description?: InputMaybe<String_Comparison_Exp>;
  token_id?: InputMaybe<String_Comparison_Exp>;
  token_name?: InputMaybe<String_Comparison_Exp>;
  total_price?: InputMaybe<Bigint_Comparison_Exp>;
  type?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Events_Max_Fields = {
  __typename?: 'events_max_fields';
  amount?: Maybe<Scalars['bigint']>;
  artist_address?: Maybe<Scalars['String']>;
  ask_id?: Maybe<Scalars['bigint']>;
  auction_id?: Maybe<Scalars['bigint']>;
  bid?: Maybe<Scalars['bigint']>;
  bid_id?: Maybe<Scalars['bigint']>;
  bidder_address?: Maybe<Scalars['String']>;
  buyer_address?: Maybe<Scalars['String']>;
  collection_id?: Maybe<Scalars['bigint']>;
  creator_name?: Maybe<Scalars['String']>;
  currency?: Maybe<Scalars['String']>;
  current_price?: Maybe<Scalars['bigint']>;
  editions?: Maybe<Scalars['bigint']>;
  eightscribo_rowone?: Maybe<Scalars['String']>;
  eightscribo_rowthree?: Maybe<Scalars['String']>;
  eightscribo_rowtwo?: Maybe<Scalars['String']>;
  eightscribo_title?: Maybe<Scalars['String']>;
  end_price?: Maybe<Scalars['bigint']>;
  end_time?: Maybe<Scalars['timestamptz']>;
  extension_time?: Maybe<Scalars['bigint']>;
  fa2_address?: Maybe<Scalars['String']>;
  from_address?: Maybe<Scalars['String']>;
  highest_bidder_address?: Maybe<Scalars['String']>;
  holder_address?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  implements?: Maybe<Scalars['String']>;
  issuer_id?: Maybe<Scalars['bigint']>;
  iteration?: Maybe<Scalars['bigint']>;
  level?: Maybe<Scalars['bigint']>;
  metadata_uri?: Maybe<Scalars['String']>;
  offer_id?: Maybe<Scalars['bigint']>;
  ophash?: Maybe<Scalars['String']>;
  opid?: Maybe<Scalars['bigint']>;
  owner_address?: Maybe<Scalars['String']>;
  price?: Maybe<Scalars['bigint']>;
  price_increment?: Maybe<Scalars['bigint']>;
  reserve?: Maybe<Scalars['bigint']>;
  rgb?: Maybe<Scalars['String']>;
  royalties?: Maybe<Scalars['bigint']>;
  seller_address?: Maybe<Scalars['String']>;
  start_price?: Maybe<Scalars['bigint']>;
  start_time?: Maybe<Scalars['timestamptz']>;
  swap_id?: Maybe<Scalars['bigint']>;
  timestamp?: Maybe<Scalars['timestamptz']>;
  to_address?: Maybe<Scalars['String']>;
  token_description?: Maybe<Scalars['String']>;
  token_id?: Maybe<Scalars['String']>;
  token_name?: Maybe<Scalars['String']>;
  total_price?: Maybe<Scalars['bigint']>;
  type?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "events" */
export type Events_Max_Order_By = {
  amount?: InputMaybe<Order_By>;
  artist_address?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  auction_id?: InputMaybe<Order_By>;
  bid?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  bidder_address?: InputMaybe<Order_By>;
  buyer_address?: InputMaybe<Order_By>;
  collection_id?: InputMaybe<Order_By>;
  creator_name?: InputMaybe<Order_By>;
  currency?: InputMaybe<Order_By>;
  current_price?: InputMaybe<Order_By>;
  editions?: InputMaybe<Order_By>;
  eightscribo_rowone?: InputMaybe<Order_By>;
  eightscribo_rowthree?: InputMaybe<Order_By>;
  eightscribo_rowtwo?: InputMaybe<Order_By>;
  eightscribo_title?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  end_time?: InputMaybe<Order_By>;
  extension_time?: InputMaybe<Order_By>;
  fa2_address?: InputMaybe<Order_By>;
  from_address?: InputMaybe<Order_By>;
  highest_bidder_address?: InputMaybe<Order_By>;
  holder_address?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  implements?: InputMaybe<Order_By>;
  issuer_id?: InputMaybe<Order_By>;
  iteration?: InputMaybe<Order_By>;
  level?: InputMaybe<Order_By>;
  metadata_uri?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  ophash?: InputMaybe<Order_By>;
  opid?: InputMaybe<Order_By>;
  owner_address?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  price_increment?: InputMaybe<Order_By>;
  reserve?: InputMaybe<Order_By>;
  rgb?: InputMaybe<Order_By>;
  royalties?: InputMaybe<Order_By>;
  seller_address?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  start_time?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
  timestamp?: InputMaybe<Order_By>;
  to_address?: InputMaybe<Order_By>;
  token_description?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
  token_name?: InputMaybe<Order_By>;
  total_price?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Events_Min_Fields = {
  __typename?: 'events_min_fields';
  amount?: Maybe<Scalars['bigint']>;
  artist_address?: Maybe<Scalars['String']>;
  ask_id?: Maybe<Scalars['bigint']>;
  auction_id?: Maybe<Scalars['bigint']>;
  bid?: Maybe<Scalars['bigint']>;
  bid_id?: Maybe<Scalars['bigint']>;
  bidder_address?: Maybe<Scalars['String']>;
  buyer_address?: Maybe<Scalars['String']>;
  collection_id?: Maybe<Scalars['bigint']>;
  creator_name?: Maybe<Scalars['String']>;
  currency?: Maybe<Scalars['String']>;
  current_price?: Maybe<Scalars['bigint']>;
  editions?: Maybe<Scalars['bigint']>;
  eightscribo_rowone?: Maybe<Scalars['String']>;
  eightscribo_rowthree?: Maybe<Scalars['String']>;
  eightscribo_rowtwo?: Maybe<Scalars['String']>;
  eightscribo_title?: Maybe<Scalars['String']>;
  end_price?: Maybe<Scalars['bigint']>;
  end_time?: Maybe<Scalars['timestamptz']>;
  extension_time?: Maybe<Scalars['bigint']>;
  fa2_address?: Maybe<Scalars['String']>;
  from_address?: Maybe<Scalars['String']>;
  highest_bidder_address?: Maybe<Scalars['String']>;
  holder_address?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  implements?: Maybe<Scalars['String']>;
  issuer_id?: Maybe<Scalars['bigint']>;
  iteration?: Maybe<Scalars['bigint']>;
  level?: Maybe<Scalars['bigint']>;
  metadata_uri?: Maybe<Scalars['String']>;
  offer_id?: Maybe<Scalars['bigint']>;
  ophash?: Maybe<Scalars['String']>;
  opid?: Maybe<Scalars['bigint']>;
  owner_address?: Maybe<Scalars['String']>;
  price?: Maybe<Scalars['bigint']>;
  price_increment?: Maybe<Scalars['bigint']>;
  reserve?: Maybe<Scalars['bigint']>;
  rgb?: Maybe<Scalars['String']>;
  royalties?: Maybe<Scalars['bigint']>;
  seller_address?: Maybe<Scalars['String']>;
  start_price?: Maybe<Scalars['bigint']>;
  start_time?: Maybe<Scalars['timestamptz']>;
  swap_id?: Maybe<Scalars['bigint']>;
  timestamp?: Maybe<Scalars['timestamptz']>;
  to_address?: Maybe<Scalars['String']>;
  token_description?: Maybe<Scalars['String']>;
  token_id?: Maybe<Scalars['String']>;
  token_name?: Maybe<Scalars['String']>;
  total_price?: Maybe<Scalars['bigint']>;
  type?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "events" */
export type Events_Min_Order_By = {
  amount?: InputMaybe<Order_By>;
  artist_address?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  auction_id?: InputMaybe<Order_By>;
  bid?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  bidder_address?: InputMaybe<Order_By>;
  buyer_address?: InputMaybe<Order_By>;
  collection_id?: InputMaybe<Order_By>;
  creator_name?: InputMaybe<Order_By>;
  currency?: InputMaybe<Order_By>;
  current_price?: InputMaybe<Order_By>;
  editions?: InputMaybe<Order_By>;
  eightscribo_rowone?: InputMaybe<Order_By>;
  eightscribo_rowthree?: InputMaybe<Order_By>;
  eightscribo_rowtwo?: InputMaybe<Order_By>;
  eightscribo_title?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  end_time?: InputMaybe<Order_By>;
  extension_time?: InputMaybe<Order_By>;
  fa2_address?: InputMaybe<Order_By>;
  from_address?: InputMaybe<Order_By>;
  highest_bidder_address?: InputMaybe<Order_By>;
  holder_address?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  implements?: InputMaybe<Order_By>;
  issuer_id?: InputMaybe<Order_By>;
  iteration?: InputMaybe<Order_By>;
  level?: InputMaybe<Order_By>;
  metadata_uri?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  ophash?: InputMaybe<Order_By>;
  opid?: InputMaybe<Order_By>;
  owner_address?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  price_increment?: InputMaybe<Order_By>;
  reserve?: InputMaybe<Order_By>;
  rgb?: InputMaybe<Order_By>;
  royalties?: InputMaybe<Order_By>;
  seller_address?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  start_time?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
  timestamp?: InputMaybe<Order_By>;
  to_address?: InputMaybe<Order_By>;
  token_description?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
  token_name?: InputMaybe<Order_By>;
  total_price?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "events". */
export type Events_Order_By = {
  amount?: InputMaybe<Order_By>;
  artist_address?: InputMaybe<Order_By>;
  artist_profile?: InputMaybe<Tzprofiles_Order_By>;
  ask_id?: InputMaybe<Order_By>;
  auction_id?: InputMaybe<Order_By>;
  bid?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  bidder_address?: InputMaybe<Order_By>;
  bidder_profile?: InputMaybe<Tzprofiles_Order_By>;
  burn_on_end?: InputMaybe<Order_By>;
  buyer_address?: InputMaybe<Order_By>;
  buyer_profile?: InputMaybe<Tzprofiles_Order_By>;
  collection_id?: InputMaybe<Order_By>;
  creator_name?: InputMaybe<Order_By>;
  currency?: InputMaybe<Order_By>;
  current_price?: InputMaybe<Order_By>;
  editions?: InputMaybe<Order_By>;
  eightscribo_rowone?: InputMaybe<Order_By>;
  eightscribo_rowthree?: InputMaybe<Order_By>;
  eightscribo_rowtwo?: InputMaybe<Order_By>;
  eightscribo_title?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  end_time?: InputMaybe<Order_By>;
  extension_time?: InputMaybe<Order_By>;
  fa2_address?: InputMaybe<Order_By>;
  from_address?: InputMaybe<Order_By>;
  from_profile?: InputMaybe<Tzprofiles_Order_By>;
  highest_bidder_address?: InputMaybe<Order_By>;
  highest_bidder_profile?: InputMaybe<Tzprofiles_Order_By>;
  holder_address?: InputMaybe<Order_By>;
  holder_profile?: InputMaybe<Tzprofiles_Order_By>;
  id?: InputMaybe<Order_By>;
  implements?: InputMaybe<Order_By>;
  is_mint?: InputMaybe<Order_By>;
  issuer_id?: InputMaybe<Order_By>;
  iteration?: InputMaybe<Order_By>;
  level?: InputMaybe<Order_By>;
  metadata_uri?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  ophash?: InputMaybe<Order_By>;
  opid?: InputMaybe<Order_By>;
  owner_address?: InputMaybe<Order_By>;
  owner_profile?: InputMaybe<Tzprofiles_Order_By>;
  price?: InputMaybe<Order_By>;
  price_increment?: InputMaybe<Order_By>;
  reserve?: InputMaybe<Order_By>;
  rgb?: InputMaybe<Order_By>;
  royalties?: InputMaybe<Order_By>;
  royalty_shares?: InputMaybe<Order_By>;
  seller_address?: InputMaybe<Order_By>;
  seller_profile?: InputMaybe<Tzprofiles_Order_By>;
  start_price?: InputMaybe<Order_By>;
  start_time?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
  timestamp?: InputMaybe<Order_By>;
  to_address?: InputMaybe<Order_By>;
  to_profile?: InputMaybe<Tzprofiles_Order_By>;
  token?: InputMaybe<Tokens_Order_By>;
  token_description?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
  token_name?: InputMaybe<Order_By>;
  total_price?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
};

/** select columns of table "events" */
export enum Events_Select_Column {
  /** column name */
  Amount = 'amount',
  /** column name */
  ArtistAddress = 'artist_address',
  /** column name */
  AskId = 'ask_id',
  /** column name */
  AuctionId = 'auction_id',
  /** column name */
  Bid = 'bid',
  /** column name */
  BidId = 'bid_id',
  /** column name */
  BidderAddress = 'bidder_address',
  /** column name */
  BurnOnEnd = 'burn_on_end',
  /** column name */
  BuyerAddress = 'buyer_address',
  /** column name */
  CollectionId = 'collection_id',
  /** column name */
  CreatorName = 'creator_name',
  /** column name */
  Currency = 'currency',
  /** column name */
  CurrentPrice = 'current_price',
  /** column name */
  Editions = 'editions',
  /** column name */
  EightscriboRowone = 'eightscribo_rowone',
  /** column name */
  EightscriboRowthree = 'eightscribo_rowthree',
  /** column name */
  EightscriboRowtwo = 'eightscribo_rowtwo',
  /** column name */
  EightscriboTitle = 'eightscribo_title',
  /** column name */
  EndPrice = 'end_price',
  /** column name */
  EndTime = 'end_time',
  /** column name */
  ExtensionTime = 'extension_time',
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  FromAddress = 'from_address',
  /** column name */
  HighestBidderAddress = 'highest_bidder_address',
  /** column name */
  HolderAddress = 'holder_address',
  /** column name */
  Id = 'id',
  /** column name */
  Implements = 'implements',
  /** column name */
  IsMint = 'is_mint',
  /** column name */
  IssuerId = 'issuer_id',
  /** column name */
  Iteration = 'iteration',
  /** column name */
  Level = 'level',
  /** column name */
  MetadataUri = 'metadata_uri',
  /** column name */
  OfferId = 'offer_id',
  /** column name */
  Ophash = 'ophash',
  /** column name */
  Opid = 'opid',
  /** column name */
  OwnerAddress = 'owner_address',
  /** column name */
  Price = 'price',
  /** column name */
  PriceIncrement = 'price_increment',
  /** column name */
  Reserve = 'reserve',
  /** column name */
  Rgb = 'rgb',
  /** column name */
  Royalties = 'royalties',
  /** column name */
  RoyaltyShares = 'royalty_shares',
  /** column name */
  SellerAddress = 'seller_address',
  /** column name */
  StartPrice = 'start_price',
  /** column name */
  StartTime = 'start_time',
  /** column name */
  SwapId = 'swap_id',
  /** column name */
  Timestamp = 'timestamp',
  /** column name */
  ToAddress = 'to_address',
  /** column name */
  TokenDescription = 'token_description',
  /** column name */
  TokenId = 'token_id',
  /** column name */
  TokenName = 'token_name',
  /** column name */
  TotalPrice = 'total_price',
  /** column name */
  Type = 'type'
}

/** aggregate stddev on columns */
export type Events_Stddev_Fields = {
  __typename?: 'events_stddev_fields';
  amount?: Maybe<Scalars['Float']>;
  ask_id?: Maybe<Scalars['Float']>;
  auction_id?: Maybe<Scalars['Float']>;
  bid?: Maybe<Scalars['Float']>;
  bid_id?: Maybe<Scalars['Float']>;
  collection_id?: Maybe<Scalars['Float']>;
  current_price?: Maybe<Scalars['Float']>;
  editions?: Maybe<Scalars['Float']>;
  end_price?: Maybe<Scalars['Float']>;
  extension_time?: Maybe<Scalars['Float']>;
  issuer_id?: Maybe<Scalars['Float']>;
  iteration?: Maybe<Scalars['Float']>;
  level?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  opid?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  price_increment?: Maybe<Scalars['Float']>;
  reserve?: Maybe<Scalars['Float']>;
  royalties?: Maybe<Scalars['Float']>;
  start_price?: Maybe<Scalars['Float']>;
  swap_id?: Maybe<Scalars['Float']>;
  total_price?: Maybe<Scalars['Float']>;
};

/** order by stddev() on columns of table "events" */
export type Events_Stddev_Order_By = {
  amount?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  auction_id?: InputMaybe<Order_By>;
  bid?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  collection_id?: InputMaybe<Order_By>;
  current_price?: InputMaybe<Order_By>;
  editions?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  extension_time?: InputMaybe<Order_By>;
  issuer_id?: InputMaybe<Order_By>;
  iteration?: InputMaybe<Order_By>;
  level?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  opid?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  price_increment?: InputMaybe<Order_By>;
  reserve?: InputMaybe<Order_By>;
  royalties?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
  total_price?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Events_Stddev_Pop_Fields = {
  __typename?: 'events_stddev_pop_fields';
  amount?: Maybe<Scalars['Float']>;
  ask_id?: Maybe<Scalars['Float']>;
  auction_id?: Maybe<Scalars['Float']>;
  bid?: Maybe<Scalars['Float']>;
  bid_id?: Maybe<Scalars['Float']>;
  collection_id?: Maybe<Scalars['Float']>;
  current_price?: Maybe<Scalars['Float']>;
  editions?: Maybe<Scalars['Float']>;
  end_price?: Maybe<Scalars['Float']>;
  extension_time?: Maybe<Scalars['Float']>;
  issuer_id?: Maybe<Scalars['Float']>;
  iteration?: Maybe<Scalars['Float']>;
  level?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  opid?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  price_increment?: Maybe<Scalars['Float']>;
  reserve?: Maybe<Scalars['Float']>;
  royalties?: Maybe<Scalars['Float']>;
  start_price?: Maybe<Scalars['Float']>;
  swap_id?: Maybe<Scalars['Float']>;
  total_price?: Maybe<Scalars['Float']>;
};

/** order by stddev_pop() on columns of table "events" */
export type Events_Stddev_Pop_Order_By = {
  amount?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  auction_id?: InputMaybe<Order_By>;
  bid?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  collection_id?: InputMaybe<Order_By>;
  current_price?: InputMaybe<Order_By>;
  editions?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  extension_time?: InputMaybe<Order_By>;
  issuer_id?: InputMaybe<Order_By>;
  iteration?: InputMaybe<Order_By>;
  level?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  opid?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  price_increment?: InputMaybe<Order_By>;
  reserve?: InputMaybe<Order_By>;
  royalties?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
  total_price?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Events_Stddev_Samp_Fields = {
  __typename?: 'events_stddev_samp_fields';
  amount?: Maybe<Scalars['Float']>;
  ask_id?: Maybe<Scalars['Float']>;
  auction_id?: Maybe<Scalars['Float']>;
  bid?: Maybe<Scalars['Float']>;
  bid_id?: Maybe<Scalars['Float']>;
  collection_id?: Maybe<Scalars['Float']>;
  current_price?: Maybe<Scalars['Float']>;
  editions?: Maybe<Scalars['Float']>;
  end_price?: Maybe<Scalars['Float']>;
  extension_time?: Maybe<Scalars['Float']>;
  issuer_id?: Maybe<Scalars['Float']>;
  iteration?: Maybe<Scalars['Float']>;
  level?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  opid?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  price_increment?: Maybe<Scalars['Float']>;
  reserve?: Maybe<Scalars['Float']>;
  royalties?: Maybe<Scalars['Float']>;
  start_price?: Maybe<Scalars['Float']>;
  swap_id?: Maybe<Scalars['Float']>;
  total_price?: Maybe<Scalars['Float']>;
};

/** order by stddev_samp() on columns of table "events" */
export type Events_Stddev_Samp_Order_By = {
  amount?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  auction_id?: InputMaybe<Order_By>;
  bid?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  collection_id?: InputMaybe<Order_By>;
  current_price?: InputMaybe<Order_By>;
  editions?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  extension_time?: InputMaybe<Order_By>;
  issuer_id?: InputMaybe<Order_By>;
  iteration?: InputMaybe<Order_By>;
  level?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  opid?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  price_increment?: InputMaybe<Order_By>;
  reserve?: InputMaybe<Order_By>;
  royalties?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
  total_price?: InputMaybe<Order_By>;
};

/** aggregate sum on columns */
export type Events_Sum_Fields = {
  __typename?: 'events_sum_fields';
  amount?: Maybe<Scalars['bigint']>;
  ask_id?: Maybe<Scalars['bigint']>;
  auction_id?: Maybe<Scalars['bigint']>;
  bid?: Maybe<Scalars['bigint']>;
  bid_id?: Maybe<Scalars['bigint']>;
  collection_id?: Maybe<Scalars['bigint']>;
  current_price?: Maybe<Scalars['bigint']>;
  editions?: Maybe<Scalars['bigint']>;
  end_price?: Maybe<Scalars['bigint']>;
  extension_time?: Maybe<Scalars['bigint']>;
  issuer_id?: Maybe<Scalars['bigint']>;
  iteration?: Maybe<Scalars['bigint']>;
  level?: Maybe<Scalars['bigint']>;
  offer_id?: Maybe<Scalars['bigint']>;
  opid?: Maybe<Scalars['bigint']>;
  price?: Maybe<Scalars['bigint']>;
  price_increment?: Maybe<Scalars['bigint']>;
  reserve?: Maybe<Scalars['bigint']>;
  royalties?: Maybe<Scalars['bigint']>;
  start_price?: Maybe<Scalars['bigint']>;
  swap_id?: Maybe<Scalars['bigint']>;
  total_price?: Maybe<Scalars['bigint']>;
};

/** order by sum() on columns of table "events" */
export type Events_Sum_Order_By = {
  amount?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  auction_id?: InputMaybe<Order_By>;
  bid?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  collection_id?: InputMaybe<Order_By>;
  current_price?: InputMaybe<Order_By>;
  editions?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  extension_time?: InputMaybe<Order_By>;
  issuer_id?: InputMaybe<Order_By>;
  iteration?: InputMaybe<Order_By>;
  level?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  opid?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  price_increment?: InputMaybe<Order_By>;
  reserve?: InputMaybe<Order_By>;
  royalties?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
  total_price?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Events_Var_Pop_Fields = {
  __typename?: 'events_var_pop_fields';
  amount?: Maybe<Scalars['Float']>;
  ask_id?: Maybe<Scalars['Float']>;
  auction_id?: Maybe<Scalars['Float']>;
  bid?: Maybe<Scalars['Float']>;
  bid_id?: Maybe<Scalars['Float']>;
  collection_id?: Maybe<Scalars['Float']>;
  current_price?: Maybe<Scalars['Float']>;
  editions?: Maybe<Scalars['Float']>;
  end_price?: Maybe<Scalars['Float']>;
  extension_time?: Maybe<Scalars['Float']>;
  issuer_id?: Maybe<Scalars['Float']>;
  iteration?: Maybe<Scalars['Float']>;
  level?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  opid?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  price_increment?: Maybe<Scalars['Float']>;
  reserve?: Maybe<Scalars['Float']>;
  royalties?: Maybe<Scalars['Float']>;
  start_price?: Maybe<Scalars['Float']>;
  swap_id?: Maybe<Scalars['Float']>;
  total_price?: Maybe<Scalars['Float']>;
};

/** order by var_pop() on columns of table "events" */
export type Events_Var_Pop_Order_By = {
  amount?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  auction_id?: InputMaybe<Order_By>;
  bid?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  collection_id?: InputMaybe<Order_By>;
  current_price?: InputMaybe<Order_By>;
  editions?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  extension_time?: InputMaybe<Order_By>;
  issuer_id?: InputMaybe<Order_By>;
  iteration?: InputMaybe<Order_By>;
  level?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  opid?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  price_increment?: InputMaybe<Order_By>;
  reserve?: InputMaybe<Order_By>;
  royalties?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
  total_price?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Events_Var_Samp_Fields = {
  __typename?: 'events_var_samp_fields';
  amount?: Maybe<Scalars['Float']>;
  ask_id?: Maybe<Scalars['Float']>;
  auction_id?: Maybe<Scalars['Float']>;
  bid?: Maybe<Scalars['Float']>;
  bid_id?: Maybe<Scalars['Float']>;
  collection_id?: Maybe<Scalars['Float']>;
  current_price?: Maybe<Scalars['Float']>;
  editions?: Maybe<Scalars['Float']>;
  end_price?: Maybe<Scalars['Float']>;
  extension_time?: Maybe<Scalars['Float']>;
  issuer_id?: Maybe<Scalars['Float']>;
  iteration?: Maybe<Scalars['Float']>;
  level?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  opid?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  price_increment?: Maybe<Scalars['Float']>;
  reserve?: Maybe<Scalars['Float']>;
  royalties?: Maybe<Scalars['Float']>;
  start_price?: Maybe<Scalars['Float']>;
  swap_id?: Maybe<Scalars['Float']>;
  total_price?: Maybe<Scalars['Float']>;
};

/** order by var_samp() on columns of table "events" */
export type Events_Var_Samp_Order_By = {
  amount?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  auction_id?: InputMaybe<Order_By>;
  bid?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  collection_id?: InputMaybe<Order_By>;
  current_price?: InputMaybe<Order_By>;
  editions?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  extension_time?: InputMaybe<Order_By>;
  issuer_id?: InputMaybe<Order_By>;
  iteration?: InputMaybe<Order_By>;
  level?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  opid?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  price_increment?: InputMaybe<Order_By>;
  reserve?: InputMaybe<Order_By>;
  royalties?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
  total_price?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Events_Variance_Fields = {
  __typename?: 'events_variance_fields';
  amount?: Maybe<Scalars['Float']>;
  ask_id?: Maybe<Scalars['Float']>;
  auction_id?: Maybe<Scalars['Float']>;
  bid?: Maybe<Scalars['Float']>;
  bid_id?: Maybe<Scalars['Float']>;
  collection_id?: Maybe<Scalars['Float']>;
  current_price?: Maybe<Scalars['Float']>;
  editions?: Maybe<Scalars['Float']>;
  end_price?: Maybe<Scalars['Float']>;
  extension_time?: Maybe<Scalars['Float']>;
  issuer_id?: Maybe<Scalars['Float']>;
  iteration?: Maybe<Scalars['Float']>;
  level?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  opid?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  price_increment?: Maybe<Scalars['Float']>;
  reserve?: Maybe<Scalars['Float']>;
  royalties?: Maybe<Scalars['Float']>;
  start_price?: Maybe<Scalars['Float']>;
  swap_id?: Maybe<Scalars['Float']>;
  total_price?: Maybe<Scalars['Float']>;
};

/** order by variance() on columns of table "events" */
export type Events_Variance_Order_By = {
  amount?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  auction_id?: InputMaybe<Order_By>;
  bid?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  collection_id?: InputMaybe<Order_By>;
  current_price?: InputMaybe<Order_By>;
  editions?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  extension_time?: InputMaybe<Order_By>;
  issuer_id?: InputMaybe<Order_By>;
  iteration?: InputMaybe<Order_By>;
  level?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  opid?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  price_increment?: InputMaybe<Order_By>;
  reserve?: InputMaybe<Order_By>;
  royalties?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
  total_price?: InputMaybe<Order_By>;
};

/** columns and relationships of "holdings" */
export type Holdings = {
  __typename?: 'holdings';
  amount: Scalars['bigint'];
  fa2_address: Scalars['String'];
  first_received_at?: Maybe<Scalars['timestamptz']>;
  holder_address: Scalars['String'];
  /** An object relationship */
  holder_profile?: Maybe<Tzprofiles>;
  last_received_at?: Maybe<Scalars['timestamptz']>;
  /** An object relationship */
  token?: Maybe<Tokens>;
  token_id: Scalars['String'];
};

/** aggregated selection of "holdings" */
export type Holdings_Aggregate = {
  __typename?: 'holdings_aggregate';
  aggregate?: Maybe<Holdings_Aggregate_Fields>;
  nodes: Array<Holdings>;
};

/** aggregate fields of "holdings" */
export type Holdings_Aggregate_Fields = {
  __typename?: 'holdings_aggregate_fields';
  avg?: Maybe<Holdings_Avg_Fields>;
  count: Scalars['Int'];
  max?: Maybe<Holdings_Max_Fields>;
  min?: Maybe<Holdings_Min_Fields>;
  stddev?: Maybe<Holdings_Stddev_Fields>;
  stddev_pop?: Maybe<Holdings_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Holdings_Stddev_Samp_Fields>;
  sum?: Maybe<Holdings_Sum_Fields>;
  var_pop?: Maybe<Holdings_Var_Pop_Fields>;
  var_samp?: Maybe<Holdings_Var_Samp_Fields>;
  variance?: Maybe<Holdings_Variance_Fields>;
};

/** aggregate fields of "holdings" */
export type Holdings_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Holdings_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "holdings" */
export type Holdings_Aggregate_Order_By = {
  avg?: InputMaybe<Holdings_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Holdings_Max_Order_By>;
  min?: InputMaybe<Holdings_Min_Order_By>;
  stddev?: InputMaybe<Holdings_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Holdings_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Holdings_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Holdings_Sum_Order_By>;
  var_pop?: InputMaybe<Holdings_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Holdings_Var_Samp_Order_By>;
  variance?: InputMaybe<Holdings_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Holdings_Avg_Fields = {
  __typename?: 'holdings_avg_fields';
  amount?: Maybe<Scalars['Float']>;
};

/** order by avg() on columns of table "holdings" */
export type Holdings_Avg_Order_By = {
  amount?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "holdings". All fields are combined with a logical 'AND'. */
export type Holdings_Bool_Exp = {
  _and?: InputMaybe<Array<Holdings_Bool_Exp>>;
  _not?: InputMaybe<Holdings_Bool_Exp>;
  _or?: InputMaybe<Array<Holdings_Bool_Exp>>;
  amount?: InputMaybe<Bigint_Comparison_Exp>;
  fa2_address?: InputMaybe<String_Comparison_Exp>;
  first_received_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  holder_address?: InputMaybe<String_Comparison_Exp>;
  holder_profile?: InputMaybe<Tzprofiles_Bool_Exp>;
  last_received_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  token?: InputMaybe<Tokens_Bool_Exp>;
  token_id?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Holdings_Max_Fields = {
  __typename?: 'holdings_max_fields';
  amount?: Maybe<Scalars['bigint']>;
  fa2_address?: Maybe<Scalars['String']>;
  first_received_at?: Maybe<Scalars['timestamptz']>;
  holder_address?: Maybe<Scalars['String']>;
  last_received_at?: Maybe<Scalars['timestamptz']>;
  token_id?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "holdings" */
export type Holdings_Max_Order_By = {
  amount?: InputMaybe<Order_By>;
  fa2_address?: InputMaybe<Order_By>;
  first_received_at?: InputMaybe<Order_By>;
  holder_address?: InputMaybe<Order_By>;
  last_received_at?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Holdings_Min_Fields = {
  __typename?: 'holdings_min_fields';
  amount?: Maybe<Scalars['bigint']>;
  fa2_address?: Maybe<Scalars['String']>;
  first_received_at?: Maybe<Scalars['timestamptz']>;
  holder_address?: Maybe<Scalars['String']>;
  last_received_at?: Maybe<Scalars['timestamptz']>;
  token_id?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "holdings" */
export type Holdings_Min_Order_By = {
  amount?: InputMaybe<Order_By>;
  fa2_address?: InputMaybe<Order_By>;
  first_received_at?: InputMaybe<Order_By>;
  holder_address?: InputMaybe<Order_By>;
  last_received_at?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "holdings". */
export type Holdings_Order_By = {
  amount?: InputMaybe<Order_By>;
  fa2_address?: InputMaybe<Order_By>;
  first_received_at?: InputMaybe<Order_By>;
  holder_address?: InputMaybe<Order_By>;
  holder_profile?: InputMaybe<Tzprofiles_Order_By>;
  last_received_at?: InputMaybe<Order_By>;
  token?: InputMaybe<Tokens_Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** select columns of table "holdings" */
export enum Holdings_Select_Column {
  /** column name */
  Amount = 'amount',
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  FirstReceivedAt = 'first_received_at',
  /** column name */
  HolderAddress = 'holder_address',
  /** column name */
  LastReceivedAt = 'last_received_at',
  /** column name */
  TokenId = 'token_id'
}

/** aggregate stddev on columns */
export type Holdings_Stddev_Fields = {
  __typename?: 'holdings_stddev_fields';
  amount?: Maybe<Scalars['Float']>;
};

/** order by stddev() on columns of table "holdings" */
export type Holdings_Stddev_Order_By = {
  amount?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Holdings_Stddev_Pop_Fields = {
  __typename?: 'holdings_stddev_pop_fields';
  amount?: Maybe<Scalars['Float']>;
};

/** order by stddev_pop() on columns of table "holdings" */
export type Holdings_Stddev_Pop_Order_By = {
  amount?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Holdings_Stddev_Samp_Fields = {
  __typename?: 'holdings_stddev_samp_fields';
  amount?: Maybe<Scalars['Float']>;
};

/** order by stddev_samp() on columns of table "holdings" */
export type Holdings_Stddev_Samp_Order_By = {
  amount?: InputMaybe<Order_By>;
};

/** aggregate sum on columns */
export type Holdings_Sum_Fields = {
  __typename?: 'holdings_sum_fields';
  amount?: Maybe<Scalars['bigint']>;
};

/** order by sum() on columns of table "holdings" */
export type Holdings_Sum_Order_By = {
  amount?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Holdings_Var_Pop_Fields = {
  __typename?: 'holdings_var_pop_fields';
  amount?: Maybe<Scalars['Float']>;
};

/** order by var_pop() on columns of table "holdings" */
export type Holdings_Var_Pop_Order_By = {
  amount?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Holdings_Var_Samp_Fields = {
  __typename?: 'holdings_var_samp_fields';
  amount?: Maybe<Scalars['Float']>;
};

/** order by var_samp() on columns of table "holdings" */
export type Holdings_Var_Samp_Order_By = {
  amount?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Holdings_Variance_Fields = {
  __typename?: 'holdings_variance_fields';
  amount?: Maybe<Scalars['Float']>;
};

/** order by variance() on columns of table "holdings" */
export type Holdings_Variance_Order_By = {
  amount?: InputMaybe<Order_By>;
};

/** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
export type Jsonb_Comparison_Exp = {
  /** is the column contained in the given json value */
  _contained_in?: InputMaybe<Scalars['jsonb']>;
  /** does the column contain the given json value at the top level */
  _contains?: InputMaybe<Scalars['jsonb']>;
  _eq?: InputMaybe<Scalars['jsonb']>;
  _gt?: InputMaybe<Scalars['jsonb']>;
  _gte?: InputMaybe<Scalars['jsonb']>;
  /** does the string exist as a top-level key in the column */
  _has_key?: InputMaybe<Scalars['String']>;
  /** do all of these strings exist as top-level keys in the column */
  _has_keys_all?: InputMaybe<Array<Scalars['String']>>;
  /** do any of these strings exist as top-level keys in the column */
  _has_keys_any?: InputMaybe<Array<Scalars['String']>>;
  _in?: InputMaybe<Array<Scalars['jsonb']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['jsonb']>;
  _lte?: InputMaybe<Scalars['jsonb']>;
  _neq?: InputMaybe<Scalars['jsonb']>;
  _nin?: InputMaybe<Array<Scalars['jsonb']>>;
};

/** columns and relationships of "listings" */
export type Listings = {
  __typename?: 'listings';
  amount: Scalars['bigint'];
  amount_left: Scalars['bigint'];
  ask_id?: Maybe<Scalars['bigint']>;
  burn_on_end?: Maybe<Scalars['Boolean']>;
  contract_address: Scalars['String'];
  created_at: Scalars['timestamptz'];
  currency?: Maybe<Scalars['String']>;
  end_price?: Maybe<Scalars['bigint']>;
  end_time?: Maybe<Scalars['timestamptz']>;
  fa2_address: Scalars['String'];
  offer_id?: Maybe<Scalars['bigint']>;
  price: Scalars['bigint'];
  seller_address: Scalars['String'];
  /** An object relationship */
  seller_profile?: Maybe<Tzprofiles>;
  start_price?: Maybe<Scalars['bigint']>;
  status: Scalars['String'];
  swap_id?: Maybe<Scalars['bigint']>;
  /** An object relationship */
  token?: Maybe<Tokens>;
  token_id: Scalars['String'];
  type: Scalars['String'];
};

/** aggregated selection of "listings" */
export type Listings_Aggregate = {
  __typename?: 'listings_aggregate';
  aggregate?: Maybe<Listings_Aggregate_Fields>;
  nodes: Array<Listings>;
};

/** aggregate fields of "listings" */
export type Listings_Aggregate_Fields = {
  __typename?: 'listings_aggregate_fields';
  avg?: Maybe<Listings_Avg_Fields>;
  count: Scalars['Int'];
  max?: Maybe<Listings_Max_Fields>;
  min?: Maybe<Listings_Min_Fields>;
  stddev?: Maybe<Listings_Stddev_Fields>;
  stddev_pop?: Maybe<Listings_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Listings_Stddev_Samp_Fields>;
  sum?: Maybe<Listings_Sum_Fields>;
  var_pop?: Maybe<Listings_Var_Pop_Fields>;
  var_samp?: Maybe<Listings_Var_Samp_Fields>;
  variance?: Maybe<Listings_Variance_Fields>;
};

/** aggregate fields of "listings" */
export type Listings_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Listings_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "listings" */
export type Listings_Aggregate_Order_By = {
  avg?: InputMaybe<Listings_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Listings_Max_Order_By>;
  min?: InputMaybe<Listings_Min_Order_By>;
  stddev?: InputMaybe<Listings_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Listings_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Listings_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Listings_Sum_Order_By>;
  var_pop?: InputMaybe<Listings_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Listings_Var_Samp_Order_By>;
  variance?: InputMaybe<Listings_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Listings_Avg_Fields = {
  __typename?: 'listings_avg_fields';
  amount?: Maybe<Scalars['Float']>;
  amount_left?: Maybe<Scalars['Float']>;
  ask_id?: Maybe<Scalars['Float']>;
  end_price?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  start_price?: Maybe<Scalars['Float']>;
  swap_id?: Maybe<Scalars['Float']>;
};

/** order by avg() on columns of table "listings" */
export type Listings_Avg_Order_By = {
  amount?: InputMaybe<Order_By>;
  amount_left?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "listings". All fields are combined with a logical 'AND'. */
export type Listings_Bool_Exp = {
  _and?: InputMaybe<Array<Listings_Bool_Exp>>;
  _not?: InputMaybe<Listings_Bool_Exp>;
  _or?: InputMaybe<Array<Listings_Bool_Exp>>;
  amount?: InputMaybe<Bigint_Comparison_Exp>;
  amount_left?: InputMaybe<Bigint_Comparison_Exp>;
  ask_id?: InputMaybe<Bigint_Comparison_Exp>;
  burn_on_end?: InputMaybe<Boolean_Comparison_Exp>;
  contract_address?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  currency?: InputMaybe<String_Comparison_Exp>;
  end_price?: InputMaybe<Bigint_Comparison_Exp>;
  end_time?: InputMaybe<Timestamptz_Comparison_Exp>;
  fa2_address?: InputMaybe<String_Comparison_Exp>;
  offer_id?: InputMaybe<Bigint_Comparison_Exp>;
  price?: InputMaybe<Bigint_Comparison_Exp>;
  seller_address?: InputMaybe<String_Comparison_Exp>;
  seller_profile?: InputMaybe<Tzprofiles_Bool_Exp>;
  start_price?: InputMaybe<Bigint_Comparison_Exp>;
  status?: InputMaybe<String_Comparison_Exp>;
  swap_id?: InputMaybe<Bigint_Comparison_Exp>;
  token?: InputMaybe<Tokens_Bool_Exp>;
  token_id?: InputMaybe<String_Comparison_Exp>;
  type?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Listings_Max_Fields = {
  __typename?: 'listings_max_fields';
  amount?: Maybe<Scalars['bigint']>;
  amount_left?: Maybe<Scalars['bigint']>;
  ask_id?: Maybe<Scalars['bigint']>;
  contract_address?: Maybe<Scalars['String']>;
  created_at?: Maybe<Scalars['timestamptz']>;
  currency?: Maybe<Scalars['String']>;
  end_price?: Maybe<Scalars['bigint']>;
  end_time?: Maybe<Scalars['timestamptz']>;
  fa2_address?: Maybe<Scalars['String']>;
  offer_id?: Maybe<Scalars['bigint']>;
  price?: Maybe<Scalars['bigint']>;
  seller_address?: Maybe<Scalars['String']>;
  start_price?: Maybe<Scalars['bigint']>;
  status?: Maybe<Scalars['String']>;
  swap_id?: Maybe<Scalars['bigint']>;
  token_id?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "listings" */
export type Listings_Max_Order_By = {
  amount?: InputMaybe<Order_By>;
  amount_left?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  contract_address?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  currency?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  end_time?: InputMaybe<Order_By>;
  fa2_address?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  seller_address?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Listings_Min_Fields = {
  __typename?: 'listings_min_fields';
  amount?: Maybe<Scalars['bigint']>;
  amount_left?: Maybe<Scalars['bigint']>;
  ask_id?: Maybe<Scalars['bigint']>;
  contract_address?: Maybe<Scalars['String']>;
  created_at?: Maybe<Scalars['timestamptz']>;
  currency?: Maybe<Scalars['String']>;
  end_price?: Maybe<Scalars['bigint']>;
  end_time?: Maybe<Scalars['timestamptz']>;
  fa2_address?: Maybe<Scalars['String']>;
  offer_id?: Maybe<Scalars['bigint']>;
  price?: Maybe<Scalars['bigint']>;
  seller_address?: Maybe<Scalars['String']>;
  start_price?: Maybe<Scalars['bigint']>;
  status?: Maybe<Scalars['String']>;
  swap_id?: Maybe<Scalars['bigint']>;
  token_id?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "listings" */
export type Listings_Min_Order_By = {
  amount?: InputMaybe<Order_By>;
  amount_left?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  contract_address?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  currency?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  end_time?: InputMaybe<Order_By>;
  fa2_address?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  seller_address?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "listings". */
export type Listings_Order_By = {
  amount?: InputMaybe<Order_By>;
  amount_left?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  burn_on_end?: InputMaybe<Order_By>;
  contract_address?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  currency?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  end_time?: InputMaybe<Order_By>;
  fa2_address?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  seller_address?: InputMaybe<Order_By>;
  seller_profile?: InputMaybe<Tzprofiles_Order_By>;
  start_price?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
  token?: InputMaybe<Tokens_Order_By>;
  token_id?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
};

/** select columns of table "listings" */
export enum Listings_Select_Column {
  /** column name */
  Amount = 'amount',
  /** column name */
  AmountLeft = 'amount_left',
  /** column name */
  AskId = 'ask_id',
  /** column name */
  BurnOnEnd = 'burn_on_end',
  /** column name */
  ContractAddress = 'contract_address',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Currency = 'currency',
  /** column name */
  EndPrice = 'end_price',
  /** column name */
  EndTime = 'end_time',
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  OfferId = 'offer_id',
  /** column name */
  Price = 'price',
  /** column name */
  SellerAddress = 'seller_address',
  /** column name */
  StartPrice = 'start_price',
  /** column name */
  Status = 'status',
  /** column name */
  SwapId = 'swap_id',
  /** column name */
  TokenId = 'token_id',
  /** column name */
  Type = 'type'
}

/** aggregate stddev on columns */
export type Listings_Stddev_Fields = {
  __typename?: 'listings_stddev_fields';
  amount?: Maybe<Scalars['Float']>;
  amount_left?: Maybe<Scalars['Float']>;
  ask_id?: Maybe<Scalars['Float']>;
  end_price?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  start_price?: Maybe<Scalars['Float']>;
  swap_id?: Maybe<Scalars['Float']>;
};

/** order by stddev() on columns of table "listings" */
export type Listings_Stddev_Order_By = {
  amount?: InputMaybe<Order_By>;
  amount_left?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Listings_Stddev_Pop_Fields = {
  __typename?: 'listings_stddev_pop_fields';
  amount?: Maybe<Scalars['Float']>;
  amount_left?: Maybe<Scalars['Float']>;
  ask_id?: Maybe<Scalars['Float']>;
  end_price?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  start_price?: Maybe<Scalars['Float']>;
  swap_id?: Maybe<Scalars['Float']>;
};

/** order by stddev_pop() on columns of table "listings" */
export type Listings_Stddev_Pop_Order_By = {
  amount?: InputMaybe<Order_By>;
  amount_left?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Listings_Stddev_Samp_Fields = {
  __typename?: 'listings_stddev_samp_fields';
  amount?: Maybe<Scalars['Float']>;
  amount_left?: Maybe<Scalars['Float']>;
  ask_id?: Maybe<Scalars['Float']>;
  end_price?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  start_price?: Maybe<Scalars['Float']>;
  swap_id?: Maybe<Scalars['Float']>;
};

/** order by stddev_samp() on columns of table "listings" */
export type Listings_Stddev_Samp_Order_By = {
  amount?: InputMaybe<Order_By>;
  amount_left?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
};

/** aggregate sum on columns */
export type Listings_Sum_Fields = {
  __typename?: 'listings_sum_fields';
  amount?: Maybe<Scalars['bigint']>;
  amount_left?: Maybe<Scalars['bigint']>;
  ask_id?: Maybe<Scalars['bigint']>;
  end_price?: Maybe<Scalars['bigint']>;
  offer_id?: Maybe<Scalars['bigint']>;
  price?: Maybe<Scalars['bigint']>;
  start_price?: Maybe<Scalars['bigint']>;
  swap_id?: Maybe<Scalars['bigint']>;
};

/** order by sum() on columns of table "listings" */
export type Listings_Sum_Order_By = {
  amount?: InputMaybe<Order_By>;
  amount_left?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Listings_Var_Pop_Fields = {
  __typename?: 'listings_var_pop_fields';
  amount?: Maybe<Scalars['Float']>;
  amount_left?: Maybe<Scalars['Float']>;
  ask_id?: Maybe<Scalars['Float']>;
  end_price?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  start_price?: Maybe<Scalars['Float']>;
  swap_id?: Maybe<Scalars['Float']>;
};

/** order by var_pop() on columns of table "listings" */
export type Listings_Var_Pop_Order_By = {
  amount?: InputMaybe<Order_By>;
  amount_left?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Listings_Var_Samp_Fields = {
  __typename?: 'listings_var_samp_fields';
  amount?: Maybe<Scalars['Float']>;
  amount_left?: Maybe<Scalars['Float']>;
  ask_id?: Maybe<Scalars['Float']>;
  end_price?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  start_price?: Maybe<Scalars['Float']>;
  swap_id?: Maybe<Scalars['Float']>;
};

/** order by var_samp() on columns of table "listings" */
export type Listings_Var_Samp_Order_By = {
  amount?: InputMaybe<Order_By>;
  amount_left?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Listings_Variance_Fields = {
  __typename?: 'listings_variance_fields';
  amount?: Maybe<Scalars['Float']>;
  amount_left?: Maybe<Scalars['Float']>;
  ask_id?: Maybe<Scalars['Float']>;
  end_price?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  start_price?: Maybe<Scalars['Float']>;
  swap_id?: Maybe<Scalars['Float']>;
};

/** order by variance() on columns of table "listings" */
export type Listings_Variance_Order_By = {
  amount?: InputMaybe<Order_By>;
  amount_left?: InputMaybe<Order_By>;
  ask_id?: InputMaybe<Order_By>;
  end_price?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  start_price?: InputMaybe<Order_By>;
  swap_id?: InputMaybe<Order_By>;
};

/** columns and relationships of "offers" */
export type Offers = {
  __typename?: 'offers';
  amount?: Maybe<Scalars['bigint']>;
  bid_id?: Maybe<Scalars['bigint']>;
  buyer_address: Scalars['String'];
  /** An object relationship */
  buyer_profile?: Maybe<Tzprofiles>;
  contract_address: Scalars['String'];
  created_at: Scalars['timestamptz'];
  currency?: Maybe<Scalars['String']>;
  fa2_address: Scalars['String'];
  offer_id?: Maybe<Scalars['bigint']>;
  price: Scalars['bigint'];
  status: Scalars['String'];
  /** An object relationship */
  token?: Maybe<Tokens>;
  token_id: Scalars['String'];
  type: Scalars['String'];
};

/** aggregated selection of "offers" */
export type Offers_Aggregate = {
  __typename?: 'offers_aggregate';
  aggregate?: Maybe<Offers_Aggregate_Fields>;
  nodes: Array<Offers>;
};

/** aggregate fields of "offers" */
export type Offers_Aggregate_Fields = {
  __typename?: 'offers_aggregate_fields';
  avg?: Maybe<Offers_Avg_Fields>;
  count: Scalars['Int'];
  max?: Maybe<Offers_Max_Fields>;
  min?: Maybe<Offers_Min_Fields>;
  stddev?: Maybe<Offers_Stddev_Fields>;
  stddev_pop?: Maybe<Offers_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Offers_Stddev_Samp_Fields>;
  sum?: Maybe<Offers_Sum_Fields>;
  var_pop?: Maybe<Offers_Var_Pop_Fields>;
  var_samp?: Maybe<Offers_Var_Samp_Fields>;
  variance?: Maybe<Offers_Variance_Fields>;
};

/** aggregate fields of "offers" */
export type Offers_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Offers_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "offers" */
export type Offers_Aggregate_Order_By = {
  avg?: InputMaybe<Offers_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Offers_Max_Order_By>;
  min?: InputMaybe<Offers_Min_Order_By>;
  stddev?: InputMaybe<Offers_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Offers_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Offers_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Offers_Sum_Order_By>;
  var_pop?: InputMaybe<Offers_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Offers_Var_Samp_Order_By>;
  variance?: InputMaybe<Offers_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Offers_Avg_Fields = {
  __typename?: 'offers_avg_fields';
  amount?: Maybe<Scalars['Float']>;
  bid_id?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
};

/** order by avg() on columns of table "offers" */
export type Offers_Avg_Order_By = {
  amount?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "offers". All fields are combined with a logical 'AND'. */
export type Offers_Bool_Exp = {
  _and?: InputMaybe<Array<Offers_Bool_Exp>>;
  _not?: InputMaybe<Offers_Bool_Exp>;
  _or?: InputMaybe<Array<Offers_Bool_Exp>>;
  amount?: InputMaybe<Bigint_Comparison_Exp>;
  bid_id?: InputMaybe<Bigint_Comparison_Exp>;
  buyer_address?: InputMaybe<String_Comparison_Exp>;
  buyer_profile?: InputMaybe<Tzprofiles_Bool_Exp>;
  contract_address?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  currency?: InputMaybe<String_Comparison_Exp>;
  fa2_address?: InputMaybe<String_Comparison_Exp>;
  offer_id?: InputMaybe<Bigint_Comparison_Exp>;
  price?: InputMaybe<Bigint_Comparison_Exp>;
  status?: InputMaybe<String_Comparison_Exp>;
  token?: InputMaybe<Tokens_Bool_Exp>;
  token_id?: InputMaybe<String_Comparison_Exp>;
  type?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Offers_Max_Fields = {
  __typename?: 'offers_max_fields';
  amount?: Maybe<Scalars['bigint']>;
  bid_id?: Maybe<Scalars['bigint']>;
  buyer_address?: Maybe<Scalars['String']>;
  contract_address?: Maybe<Scalars['String']>;
  created_at?: Maybe<Scalars['timestamptz']>;
  currency?: Maybe<Scalars['String']>;
  fa2_address?: Maybe<Scalars['String']>;
  offer_id?: Maybe<Scalars['bigint']>;
  price?: Maybe<Scalars['bigint']>;
  status?: Maybe<Scalars['String']>;
  token_id?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "offers" */
export type Offers_Max_Order_By = {
  amount?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  buyer_address?: InputMaybe<Order_By>;
  contract_address?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  currency?: InputMaybe<Order_By>;
  fa2_address?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Offers_Min_Fields = {
  __typename?: 'offers_min_fields';
  amount?: Maybe<Scalars['bigint']>;
  bid_id?: Maybe<Scalars['bigint']>;
  buyer_address?: Maybe<Scalars['String']>;
  contract_address?: Maybe<Scalars['String']>;
  created_at?: Maybe<Scalars['timestamptz']>;
  currency?: Maybe<Scalars['String']>;
  fa2_address?: Maybe<Scalars['String']>;
  offer_id?: Maybe<Scalars['bigint']>;
  price?: Maybe<Scalars['bigint']>;
  status?: Maybe<Scalars['String']>;
  token_id?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "offers" */
export type Offers_Min_Order_By = {
  amount?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  buyer_address?: InputMaybe<Order_By>;
  contract_address?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  currency?: InputMaybe<Order_By>;
  fa2_address?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "offers". */
export type Offers_Order_By = {
  amount?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  buyer_address?: InputMaybe<Order_By>;
  buyer_profile?: InputMaybe<Tzprofiles_Order_By>;
  contract_address?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  currency?: InputMaybe<Order_By>;
  fa2_address?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  token?: InputMaybe<Tokens_Order_By>;
  token_id?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
};

/** select columns of table "offers" */
export enum Offers_Select_Column {
  /** column name */
  Amount = 'amount',
  /** column name */
  BidId = 'bid_id',
  /** column name */
  BuyerAddress = 'buyer_address',
  /** column name */
  ContractAddress = 'contract_address',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Currency = 'currency',
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  OfferId = 'offer_id',
  /** column name */
  Price = 'price',
  /** column name */
  Status = 'status',
  /** column name */
  TokenId = 'token_id',
  /** column name */
  Type = 'type'
}

/** aggregate stddev on columns */
export type Offers_Stddev_Fields = {
  __typename?: 'offers_stddev_fields';
  amount?: Maybe<Scalars['Float']>;
  bid_id?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
};

/** order by stddev() on columns of table "offers" */
export type Offers_Stddev_Order_By = {
  amount?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Offers_Stddev_Pop_Fields = {
  __typename?: 'offers_stddev_pop_fields';
  amount?: Maybe<Scalars['Float']>;
  bid_id?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
};

/** order by stddev_pop() on columns of table "offers" */
export type Offers_Stddev_Pop_Order_By = {
  amount?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Offers_Stddev_Samp_Fields = {
  __typename?: 'offers_stddev_samp_fields';
  amount?: Maybe<Scalars['Float']>;
  bid_id?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
};

/** order by stddev_samp() on columns of table "offers" */
export type Offers_Stddev_Samp_Order_By = {
  amount?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
};

/** aggregate sum on columns */
export type Offers_Sum_Fields = {
  __typename?: 'offers_sum_fields';
  amount?: Maybe<Scalars['bigint']>;
  bid_id?: Maybe<Scalars['bigint']>;
  offer_id?: Maybe<Scalars['bigint']>;
  price?: Maybe<Scalars['bigint']>;
};

/** order by sum() on columns of table "offers" */
export type Offers_Sum_Order_By = {
  amount?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Offers_Var_Pop_Fields = {
  __typename?: 'offers_var_pop_fields';
  amount?: Maybe<Scalars['Float']>;
  bid_id?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
};

/** order by var_pop() on columns of table "offers" */
export type Offers_Var_Pop_Order_By = {
  amount?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Offers_Var_Samp_Fields = {
  __typename?: 'offers_var_samp_fields';
  amount?: Maybe<Scalars['Float']>;
  bid_id?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
};

/** order by var_samp() on columns of table "offers" */
export type Offers_Var_Samp_Order_By = {
  amount?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Offers_Variance_Fields = {
  __typename?: 'offers_variance_fields';
  amount?: Maybe<Scalars['Float']>;
  bid_id?: Maybe<Scalars['Float']>;
  offer_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
};

/** order by variance() on columns of table "offers" */
export type Offers_Variance_Order_By = {
  amount?: InputMaybe<Order_By>;
  bid_id?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
};

/** column ordering options */
export enum Order_By {
  /** in ascending order, nulls last */
  Asc = 'asc',
  /** in ascending order, nulls first */
  AscNullsFirst = 'asc_nulls_first',
  /** in ascending order, nulls last */
  AscNullsLast = 'asc_nulls_last',
  /** in descending order, nulls first */
  Desc = 'desc',
  /** in descending order, nulls first */
  DescNullsFirst = 'desc_nulls_first',
  /** in descending order, nulls last */
  DescNullsLast = 'desc_nulls_last'
}

export type Query_Root = {
  __typename?: 'query_root';
  /** An array relationship */
  events: Array<Events>;
  /** An aggregate relationship */
  events_aggregate: Events_Aggregate;
  /** fetch data from the table: "events" using primary key columns */
  events_by_pk?: Maybe<Events>;
  /** An array relationship */
  holdings: Array<Holdings>;
  /** An aggregate relationship */
  holdings_aggregate: Holdings_Aggregate;
  /** fetch data from the table: "holdings" using primary key columns */
  holdings_by_pk?: Maybe<Holdings>;
  /** An array relationship */
  listings: Array<Listings>;
  /** An aggregate relationship */
  listings_aggregate: Listings_Aggregate;
  /** fetch data from the table: "offers" */
  offers: Array<Offers>;
  /** An aggregate relationship */
  offers_aggregate: Offers_Aggregate;
  /** An array relationship */
  royalty_receivers: Array<Royalty_Receivers>;
  /** fetch data from the table: "royalty_receivers" using primary key columns */
  royalty_receivers_by_pk?: Maybe<Royalty_Receivers>;
  /** An array relationship */
  tags: Array<Tags>;
  /** An aggregate relationship */
  tags_aggregate: Tags_Aggregate;
  /** fetch data from the table: "tags" using primary key columns */
  tags_by_pk?: Maybe<Tags>;
  /** fetch data from the table: "tokens" */
  tokens: Array<Tokens>;
  /** fetch aggregated fields from the table: "tokens" */
  tokens_aggregate: Tokens_Aggregate;
  /** fetch data from the table: "tokens" using primary key columns */
  tokens_by_pk?: Maybe<Tokens>;
  /** fetch data from the table: "tzprofiles.tzprofiles" */
  tzprofiles: Array<Tzprofiles>;
  /** fetch aggregated fields from the table: "tzprofiles.tzprofiles" */
  tzprofiles_aggregate: Tzprofiles_Aggregate;
  /** fetch data from the table: "tzprofiles.tzprofiles" using primary key columns */
  tzprofiles_by_pk?: Maybe<Tzprofiles>;
};

export type Query_RootEventsArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Events_Order_By>>;
  where?: InputMaybe<Events_Bool_Exp>;
};

export type Query_RootEvents_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Events_Order_By>>;
  where?: InputMaybe<Events_Bool_Exp>;
};

export type Query_RootEvents_By_PkArgs = {
  id: Scalars['String'];
};

export type Query_RootHoldingsArgs = {
  distinct_on?: InputMaybe<Array<Holdings_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Holdings_Order_By>>;
  where?: InputMaybe<Holdings_Bool_Exp>;
};

export type Query_RootHoldings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Holdings_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Holdings_Order_By>>;
  where?: InputMaybe<Holdings_Bool_Exp>;
};

export type Query_RootHoldings_By_PkArgs = {
  fa2_address: Scalars['String'];
  holder_address: Scalars['String'];
  token_id: Scalars['String'];
};

export type Query_RootListingsArgs = {
  distinct_on?: InputMaybe<Array<Listings_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Listings_Order_By>>;
  where?: InputMaybe<Listings_Bool_Exp>;
};

export type Query_RootListings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Listings_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Listings_Order_By>>;
  where?: InputMaybe<Listings_Bool_Exp>;
};

export type Query_RootOffersArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Offers_Order_By>>;
  where?: InputMaybe<Offers_Bool_Exp>;
};

export type Query_RootOffers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Offers_Order_By>>;
  where?: InputMaybe<Offers_Bool_Exp>;
};

export type Query_RootRoyalty_ReceiversArgs = {
  distinct_on?: InputMaybe<Array<Royalty_Receivers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Royalty_Receivers_Order_By>>;
  where?: InputMaybe<Royalty_Receivers_Bool_Exp>;
};

export type Query_RootRoyalty_Receivers_By_PkArgs = {
  fa2_address: Scalars['String'];
  receiver_address: Scalars['String'];
  token_id: Scalars['String'];
};

export type Query_RootTagsArgs = {
  distinct_on?: InputMaybe<Array<Tags_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Tags_Order_By>>;
  where?: InputMaybe<Tags_Bool_Exp>;
};

export type Query_RootTags_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Tags_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Tags_Order_By>>;
  where?: InputMaybe<Tags_Bool_Exp>;
};

export type Query_RootTags_By_PkArgs = {
  fa2_address: Scalars['String'];
  tag: Scalars['String'];
  token_id: Scalars['String'];
};

export type Query_RootTokensArgs = {
  distinct_on?: InputMaybe<Array<Tokens_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Tokens_Order_By>>;
  where?: InputMaybe<Tokens_Bool_Exp>;
};

export type Query_RootTokens_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Tokens_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Tokens_Order_By>>;
  where?: InputMaybe<Tokens_Bool_Exp>;
};

export type Query_RootTokens_By_PkArgs = {
  fa2_address: Scalars['String'];
  token_id: Scalars['String'];
};

export type Query_RootTzprofilesArgs = {
  distinct_on?: InputMaybe<Array<Tzprofiles_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Tzprofiles_Order_By>>;
  where?: InputMaybe<Tzprofiles_Bool_Exp>;
};

export type Query_RootTzprofiles_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Tzprofiles_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Tzprofiles_Order_By>>;
  where?: InputMaybe<Tzprofiles_Bool_Exp>;
};

export type Query_RootTzprofiles_By_PkArgs = {
  account: Scalars['String'];
};

/** columns and relationships of "royalty_receivers" */
export type Royalty_Receivers = {
  __typename?: 'royalty_receivers';
  fa2_address: Scalars['String'];
  receiver_address: Scalars['String'];
  /** An object relationship */
  receiver_profile?: Maybe<Tzprofiles>;
  royalties: Scalars['bigint'];
  /** An object relationship */
  token?: Maybe<Tokens>;
  token_id: Scalars['String'];
};

/** order by aggregate values of table "royalty_receivers" */
export type Royalty_Receivers_Aggregate_Order_By = {
  avg?: InputMaybe<Royalty_Receivers_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Royalty_Receivers_Max_Order_By>;
  min?: InputMaybe<Royalty_Receivers_Min_Order_By>;
  stddev?: InputMaybe<Royalty_Receivers_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Royalty_Receivers_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Royalty_Receivers_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Royalty_Receivers_Sum_Order_By>;
  var_pop?: InputMaybe<Royalty_Receivers_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Royalty_Receivers_Var_Samp_Order_By>;
  variance?: InputMaybe<Royalty_Receivers_Variance_Order_By>;
};

/** order by avg() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Avg_Order_By = {
  royalties?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "royalty_receivers". All fields are combined with a logical 'AND'. */
export type Royalty_Receivers_Bool_Exp = {
  _and?: InputMaybe<Array<Royalty_Receivers_Bool_Exp>>;
  _not?: InputMaybe<Royalty_Receivers_Bool_Exp>;
  _or?: InputMaybe<Array<Royalty_Receivers_Bool_Exp>>;
  fa2_address?: InputMaybe<String_Comparison_Exp>;
  receiver_address?: InputMaybe<String_Comparison_Exp>;
  receiver_profile?: InputMaybe<Tzprofiles_Bool_Exp>;
  royalties?: InputMaybe<Bigint_Comparison_Exp>;
  token?: InputMaybe<Tokens_Bool_Exp>;
  token_id?: InputMaybe<String_Comparison_Exp>;
};

/** order by max() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Max_Order_By = {
  fa2_address?: InputMaybe<Order_By>;
  receiver_address?: InputMaybe<Order_By>;
  royalties?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** order by min() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Min_Order_By = {
  fa2_address?: InputMaybe<Order_By>;
  receiver_address?: InputMaybe<Order_By>;
  royalties?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "royalty_receivers". */
export type Royalty_Receivers_Order_By = {
  fa2_address?: InputMaybe<Order_By>;
  receiver_address?: InputMaybe<Order_By>;
  receiver_profile?: InputMaybe<Tzprofiles_Order_By>;
  royalties?: InputMaybe<Order_By>;
  token?: InputMaybe<Tokens_Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** select columns of table "royalty_receivers" */
export enum Royalty_Receivers_Select_Column {
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  ReceiverAddress = 'receiver_address',
  /** column name */
  Royalties = 'royalties',
  /** column name */
  TokenId = 'token_id'
}

/** order by stddev() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Stddev_Order_By = {
  royalties?: InputMaybe<Order_By>;
};

/** order by stddev_pop() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Stddev_Pop_Order_By = {
  royalties?: InputMaybe<Order_By>;
};

/** order by stddev_samp() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Stddev_Samp_Order_By = {
  royalties?: InputMaybe<Order_By>;
};

/** order by sum() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Sum_Order_By = {
  royalties?: InputMaybe<Order_By>;
};

/** order by var_pop() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Var_Pop_Order_By = {
  royalties?: InputMaybe<Order_By>;
};

/** order by var_samp() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Var_Samp_Order_By = {
  royalties?: InputMaybe<Order_By>;
};

/** order by variance() on columns of table "royalty_receivers" */
export type Royalty_Receivers_Variance_Order_By = {
  royalties?: InputMaybe<Order_By>;
};

export type Subscription_Root = {
  __typename?: 'subscription_root';
  /** An array relationship */
  events: Array<Events>;
  /** An aggregate relationship */
  events_aggregate: Events_Aggregate;
  /** fetch data from the table: "events" using primary key columns */
  events_by_pk?: Maybe<Events>;
  /** An array relationship */
  holdings: Array<Holdings>;
  /** An aggregate relationship */
  holdings_aggregate: Holdings_Aggregate;
  /** fetch data from the table: "holdings" using primary key columns */
  holdings_by_pk?: Maybe<Holdings>;
  /** An array relationship */
  listings: Array<Listings>;
  /** An aggregate relationship */
  listings_aggregate: Listings_Aggregate;
  /** fetch data from the table: "offers" */
  offers: Array<Offers>;
  /** An aggregate relationship */
  offers_aggregate: Offers_Aggregate;
  /** An array relationship */
  royalty_receivers: Array<Royalty_Receivers>;
  /** fetch data from the table: "royalty_receivers" using primary key columns */
  royalty_receivers_by_pk?: Maybe<Royalty_Receivers>;
  /** An array relationship */
  tags: Array<Tags>;
  /** An aggregate relationship */
  tags_aggregate: Tags_Aggregate;
  /** fetch data from the table: "tags" using primary key columns */
  tags_by_pk?: Maybe<Tags>;
  /** fetch data from the table: "tokens" */
  tokens: Array<Tokens>;
  /** fetch aggregated fields from the table: "tokens" */
  tokens_aggregate: Tokens_Aggregate;
  /** fetch data from the table: "tokens" using primary key columns */
  tokens_by_pk?: Maybe<Tokens>;
  /** fetch data from the table: "tzprofiles.tzprofiles" */
  tzprofiles: Array<Tzprofiles>;
  /** fetch aggregated fields from the table: "tzprofiles.tzprofiles" */
  tzprofiles_aggregate: Tzprofiles_Aggregate;
  /** fetch data from the table: "tzprofiles.tzprofiles" using primary key columns */
  tzprofiles_by_pk?: Maybe<Tzprofiles>;
};

export type Subscription_RootEventsArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Events_Order_By>>;
  where?: InputMaybe<Events_Bool_Exp>;
};

export type Subscription_RootEvents_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Events_Order_By>>;
  where?: InputMaybe<Events_Bool_Exp>;
};

export type Subscription_RootEvents_By_PkArgs = {
  id: Scalars['String'];
};

export type Subscription_RootHoldingsArgs = {
  distinct_on?: InputMaybe<Array<Holdings_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Holdings_Order_By>>;
  where?: InputMaybe<Holdings_Bool_Exp>;
};

export type Subscription_RootHoldings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Holdings_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Holdings_Order_By>>;
  where?: InputMaybe<Holdings_Bool_Exp>;
};

export type Subscription_RootHoldings_By_PkArgs = {
  fa2_address: Scalars['String'];
  holder_address: Scalars['String'];
  token_id: Scalars['String'];
};

export type Subscription_RootListingsArgs = {
  distinct_on?: InputMaybe<Array<Listings_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Listings_Order_By>>;
  where?: InputMaybe<Listings_Bool_Exp>;
};

export type Subscription_RootListings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Listings_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Listings_Order_By>>;
  where?: InputMaybe<Listings_Bool_Exp>;
};

export type Subscription_RootOffersArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Offers_Order_By>>;
  where?: InputMaybe<Offers_Bool_Exp>;
};

export type Subscription_RootOffers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Offers_Order_By>>;
  where?: InputMaybe<Offers_Bool_Exp>;
};

export type Subscription_RootRoyalty_ReceiversArgs = {
  distinct_on?: InputMaybe<Array<Royalty_Receivers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Royalty_Receivers_Order_By>>;
  where?: InputMaybe<Royalty_Receivers_Bool_Exp>;
};

export type Subscription_RootRoyalty_Receivers_By_PkArgs = {
  fa2_address: Scalars['String'];
  receiver_address: Scalars['String'];
  token_id: Scalars['String'];
};

export type Subscription_RootTagsArgs = {
  distinct_on?: InputMaybe<Array<Tags_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Tags_Order_By>>;
  where?: InputMaybe<Tags_Bool_Exp>;
};

export type Subscription_RootTags_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Tags_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Tags_Order_By>>;
  where?: InputMaybe<Tags_Bool_Exp>;
};

export type Subscription_RootTags_By_PkArgs = {
  fa2_address: Scalars['String'];
  tag: Scalars['String'];
  token_id: Scalars['String'];
};

export type Subscription_RootTokensArgs = {
  distinct_on?: InputMaybe<Array<Tokens_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Tokens_Order_By>>;
  where?: InputMaybe<Tokens_Bool_Exp>;
};

export type Subscription_RootTokens_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Tokens_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Tokens_Order_By>>;
  where?: InputMaybe<Tokens_Bool_Exp>;
};

export type Subscription_RootTokens_By_PkArgs = {
  fa2_address: Scalars['String'];
  token_id: Scalars['String'];
};

export type Subscription_RootTzprofilesArgs = {
  distinct_on?: InputMaybe<Array<Tzprofiles_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Tzprofiles_Order_By>>;
  where?: InputMaybe<Tzprofiles_Bool_Exp>;
};

export type Subscription_RootTzprofiles_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Tzprofiles_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Tzprofiles_Order_By>>;
  where?: InputMaybe<Tzprofiles_Bool_Exp>;
};

export type Subscription_RootTzprofiles_By_PkArgs = {
  account: Scalars['String'];
};

/** columns and relationships of "tags" */
export type Tags = {
  __typename?: 'tags';
  fa2_address: Scalars['String'];
  tag: Scalars['String'];
  /** An object relationship */
  token?: Maybe<Tokens>;
  token_id: Scalars['String'];
};

/** aggregated selection of "tags" */
export type Tags_Aggregate = {
  __typename?: 'tags_aggregate';
  aggregate?: Maybe<Tags_Aggregate_Fields>;
  nodes: Array<Tags>;
};

/** aggregate fields of "tags" */
export type Tags_Aggregate_Fields = {
  __typename?: 'tags_aggregate_fields';
  count: Scalars['Int'];
  max?: Maybe<Tags_Max_Fields>;
  min?: Maybe<Tags_Min_Fields>;
};

/** aggregate fields of "tags" */
export type Tags_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Tags_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "tags" */
export type Tags_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Tags_Max_Order_By>;
  min?: InputMaybe<Tags_Min_Order_By>;
};

/** Boolean expression to filter rows from the table "tags". All fields are combined with a logical 'AND'. */
export type Tags_Bool_Exp = {
  _and?: InputMaybe<Array<Tags_Bool_Exp>>;
  _not?: InputMaybe<Tags_Bool_Exp>;
  _or?: InputMaybe<Array<Tags_Bool_Exp>>;
  fa2_address?: InputMaybe<String_Comparison_Exp>;
  tag?: InputMaybe<String_Comparison_Exp>;
  token?: InputMaybe<Tokens_Bool_Exp>;
  token_id?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Tags_Max_Fields = {
  __typename?: 'tags_max_fields';
  fa2_address?: Maybe<Scalars['String']>;
  tag?: Maybe<Scalars['String']>;
  token_id?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "tags" */
export type Tags_Max_Order_By = {
  fa2_address?: InputMaybe<Order_By>;
  tag?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Tags_Min_Fields = {
  __typename?: 'tags_min_fields';
  fa2_address?: Maybe<Scalars['String']>;
  tag?: Maybe<Scalars['String']>;
  token_id?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "tags" */
export type Tags_Min_Order_By = {
  fa2_address?: InputMaybe<Order_By>;
  tag?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "tags". */
export type Tags_Order_By = {
  fa2_address?: InputMaybe<Order_By>;
  tag?: InputMaybe<Order_By>;
  token?: InputMaybe<Tokens_Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** select columns of table "tags" */
export enum Tags_Select_Column {
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  Tag = 'tag',
  /** column name */
  TokenId = 'token_id'
}

/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['timestamptz']>;
  _gt?: InputMaybe<Scalars['timestamptz']>;
  _gte?: InputMaybe<Scalars['timestamptz']>;
  _in?: InputMaybe<Array<Scalars['timestamptz']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['timestamptz']>;
  _lte?: InputMaybe<Scalars['timestamptz']>;
  _neq?: InputMaybe<Scalars['timestamptz']>;
  _nin?: InputMaybe<Array<Scalars['timestamptz']>>;
};

/** columns and relationships of "tokens" */
export type Tokens = {
  __typename?: 'tokens';
  artifact_metadata?: Maybe<Scalars['jsonb']>;
  artifact_uri?: Maybe<Scalars['String']>;
  artist_address?: Maybe<Scalars['String']>;
  /** An object relationship */
  artist_profile?: Maybe<Tzprofiles>;
  assets?: Maybe<Scalars['jsonb']>;
  attributes?: Maybe<Scalars['jsonb']>;
  burned_editions?: Maybe<Scalars['bigint']>;
  contributors?: Maybe<Scalars['jsonb']>;
  creators?: Maybe<Scalars['jsonb']>;
  current_price_to_first_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_first_sales_price_pct?: Maybe<Scalars['bigint']>;
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['bigint']>;
  current_price_to_last_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_last_sales_price_pct?: Maybe<Scalars['bigint']>;
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['bigint']>;
  description?: Maybe<Scalars['String']>;
  display_uri?: Maybe<Scalars['String']>;
  editions?: Maybe<Scalars['bigint']>;
  eightbid_creator_name?: Maybe<Scalars['String']>;
  eightbid_rgb?: Maybe<Scalars['String']>;
  eightscribo_rowone?: Maybe<Scalars['String']>;
  eightscribo_rowthree?: Maybe<Scalars['String']>;
  eightscribo_rowtwo?: Maybe<Scalars['String']>;
  eightscribo_title?: Maybe<Scalars['String']>;
  /** An array relationship */
  events: Array<Events>;
  /** An aggregate relationship */
  events_aggregate: Events_Aggregate;
  external_uri?: Maybe<Scalars['String']>;
  fa2_address: Scalars['String'];
  first_sales_price?: Maybe<Scalars['bigint']>;
  formats?: Maybe<Scalars['jsonb']>;
  fx_collection_description?: Maybe<Scalars['String']>;
  fx_collection_display_uri?: Maybe<Scalars['String']>;
  fx_collection_editions?: Maybe<Scalars['bigint']>;
  fx_collection_name?: Maybe<Scalars['String']>;
  fx_collection_thumbnail_uri?: Maybe<Scalars['String']>;
  fx_issuer_id?: Maybe<Scalars['bigint']>;
  fx_iteration?: Maybe<Scalars['bigint']>;
  highest_offer_price?: Maybe<Scalars['bigint']>;
  highest_sales_price?: Maybe<Scalars['bigint']>;
  /** An array relationship */
  holdings: Array<Holdings>;
  /** An aggregate relationship */
  holdings_aggregate: Holdings_Aggregate;
  last_processed_event_id?: Maybe<Scalars['String']>;
  last_processed_event_level?: Maybe<Scalars['bigint']>;
  last_processed_event_timestamp?: Maybe<Scalars['timestamptz']>;
  last_sale_at?: Maybe<Scalars['timestamptz']>;
  last_sales_price?: Maybe<Scalars['bigint']>;
  /** An array relationship */
  listings: Array<Listings>;
  /** An aggregate relationship */
  listings_aggregate: Listings_Aggregate;
  lowest_sales_price?: Maybe<Scalars['bigint']>;
  metadata_status: Scalars['String'];
  metadata_uri?: Maybe<Scalars['String']>;
  mime_type?: Maybe<Scalars['String']>;
  mint_price?: Maybe<Scalars['bigint']>;
  minted_at?: Maybe<Scalars['timestamptz']>;
  minter_address?: Maybe<Scalars['String']>;
  /** An object relationship */
  minter_profile?: Maybe<Tzprofiles>;
  name?: Maybe<Scalars['String']>;
  objkt_artist_collection_id?: Maybe<Scalars['bigint']>;
  /** fetch data from the table: "offers" */
  offers: Array<Offers>;
  /** An aggregate relationship */
  offers_aggregate: Offers_Aggregate;
  platform?: Maybe<Scalars['String']>;
  price?: Maybe<Scalars['bigint']>;
  right_uri?: Maybe<Scalars['String']>;
  rights?: Maybe<Scalars['String']>;
  royalties?: Maybe<Scalars['jsonb']>;
  royalties_total?: Maybe<Scalars['bigint']>;
  /** An array relationship */
  royalty_receivers: Array<Royalty_Receivers>;
  sales_count?: Maybe<Scalars['bigint']>;
  sales_volume?: Maybe<Scalars['bigint']>;
  symbol?: Maybe<Scalars['String']>;
  /** An array relationship */
  tags: Array<Tags>;
  /** An aggregate relationship */
  tags_aggregate: Tags_Aggregate;
  thumbnail_uri?: Maybe<Scalars['String']>;
  token_id: Scalars['String'];
};

/** columns and relationships of "tokens" */
export type TokensArtifact_MetadataArgs = {
  path?: InputMaybe<Scalars['String']>;
};

/** columns and relationships of "tokens" */
export type TokensAssetsArgs = {
  path?: InputMaybe<Scalars['String']>;
};

/** columns and relationships of "tokens" */
export type TokensAttributesArgs = {
  path?: InputMaybe<Scalars['String']>;
};

/** columns and relationships of "tokens" */
export type TokensContributorsArgs = {
  path?: InputMaybe<Scalars['String']>;
};

/** columns and relationships of "tokens" */
export type TokensCreatorsArgs = {
  path?: InputMaybe<Scalars['String']>;
};

/** columns and relationships of "tokens" */
export type TokensEventsArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Events_Order_By>>;
  where?: InputMaybe<Events_Bool_Exp>;
};

/** columns and relationships of "tokens" */
export type TokensEvents_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Events_Order_By>>;
  where?: InputMaybe<Events_Bool_Exp>;
};

/** columns and relationships of "tokens" */
export type TokensFormatsArgs = {
  path?: InputMaybe<Scalars['String']>;
};

/** columns and relationships of "tokens" */
export type TokensHoldingsArgs = {
  distinct_on?: InputMaybe<Array<Holdings_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Holdings_Order_By>>;
  where?: InputMaybe<Holdings_Bool_Exp>;
};

/** columns and relationships of "tokens" */
export type TokensHoldings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Holdings_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Holdings_Order_By>>;
  where?: InputMaybe<Holdings_Bool_Exp>;
};

/** columns and relationships of "tokens" */
export type TokensListingsArgs = {
  distinct_on?: InputMaybe<Array<Listings_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Listings_Order_By>>;
  where?: InputMaybe<Listings_Bool_Exp>;
};

/** columns and relationships of "tokens" */
export type TokensListings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Listings_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Listings_Order_By>>;
  where?: InputMaybe<Listings_Bool_Exp>;
};

/** columns and relationships of "tokens" */
export type TokensOffersArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Offers_Order_By>>;
  where?: InputMaybe<Offers_Bool_Exp>;
};

/** columns and relationships of "tokens" */
export type TokensOffers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Offers_Order_By>>;
  where?: InputMaybe<Offers_Bool_Exp>;
};

/** columns and relationships of "tokens" */
export type TokensRoyaltiesArgs = {
  path?: InputMaybe<Scalars['String']>;
};

/** columns and relationships of "tokens" */
export type TokensRoyalty_ReceiversArgs = {
  distinct_on?: InputMaybe<Array<Royalty_Receivers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Royalty_Receivers_Order_By>>;
  where?: InputMaybe<Royalty_Receivers_Bool_Exp>;
};

/** columns and relationships of "tokens" */
export type TokensTagsArgs = {
  distinct_on?: InputMaybe<Array<Tags_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Tags_Order_By>>;
  where?: InputMaybe<Tags_Bool_Exp>;
};

/** columns and relationships of "tokens" */
export type TokensTags_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Tags_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Tags_Order_By>>;
  where?: InputMaybe<Tags_Bool_Exp>;
};

/** aggregated selection of "tokens" */
export type Tokens_Aggregate = {
  __typename?: 'tokens_aggregate';
  aggregate?: Maybe<Tokens_Aggregate_Fields>;
  nodes: Array<Tokens>;
};

/** aggregate fields of "tokens" */
export type Tokens_Aggregate_Fields = {
  __typename?: 'tokens_aggregate_fields';
  avg?: Maybe<Tokens_Avg_Fields>;
  count: Scalars['Int'];
  max?: Maybe<Tokens_Max_Fields>;
  min?: Maybe<Tokens_Min_Fields>;
  stddev?: Maybe<Tokens_Stddev_Fields>;
  stddev_pop?: Maybe<Tokens_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Tokens_Stddev_Samp_Fields>;
  sum?: Maybe<Tokens_Sum_Fields>;
  var_pop?: Maybe<Tokens_Var_Pop_Fields>;
  var_samp?: Maybe<Tokens_Var_Samp_Fields>;
  variance?: Maybe<Tokens_Variance_Fields>;
};

/** aggregate fields of "tokens" */
export type Tokens_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Tokens_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** aggregate avg on columns */
export type Tokens_Avg_Fields = {
  __typename?: 'tokens_avg_fields';
  burned_editions?: Maybe<Scalars['Float']>;
  current_price_to_first_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_first_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_last_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_last_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['Float']>;
  editions?: Maybe<Scalars['Float']>;
  first_sales_price?: Maybe<Scalars['Float']>;
  fx_collection_editions?: Maybe<Scalars['Float']>;
  fx_issuer_id?: Maybe<Scalars['Float']>;
  fx_iteration?: Maybe<Scalars['Float']>;
  highest_offer_price?: Maybe<Scalars['Float']>;
  highest_sales_price?: Maybe<Scalars['Float']>;
  last_processed_event_level?: Maybe<Scalars['Float']>;
  last_sales_price?: Maybe<Scalars['Float']>;
  lowest_sales_price?: Maybe<Scalars['Float']>;
  mint_price?: Maybe<Scalars['Float']>;
  objkt_artist_collection_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  royalties_total?: Maybe<Scalars['Float']>;
  sales_count?: Maybe<Scalars['Float']>;
  sales_volume?: Maybe<Scalars['Float']>;
};

/** Boolean expression to filter rows from the table "tokens". All fields are combined with a logical 'AND'. */
export type Tokens_Bool_Exp = {
  _and?: InputMaybe<Array<Tokens_Bool_Exp>>;
  _not?: InputMaybe<Tokens_Bool_Exp>;
  _or?: InputMaybe<Array<Tokens_Bool_Exp>>;
  artifact_metadata?: InputMaybe<Jsonb_Comparison_Exp>;
  artifact_uri?: InputMaybe<String_Comparison_Exp>;
  artist_address?: InputMaybe<String_Comparison_Exp>;
  artist_profile?: InputMaybe<Tzprofiles_Bool_Exp>;
  assets?: InputMaybe<Jsonb_Comparison_Exp>;
  attributes?: InputMaybe<Jsonb_Comparison_Exp>;
  burned_editions?: InputMaybe<Bigint_Comparison_Exp>;
  contributors?: InputMaybe<Jsonb_Comparison_Exp>;
  creators?: InputMaybe<Jsonb_Comparison_Exp>;
  current_price_to_first_sales_price_diff?: InputMaybe<Bigint_Comparison_Exp>;
  current_price_to_first_sales_price_pct?: InputMaybe<Bigint_Comparison_Exp>;
  current_price_to_highest_sales_price_diff?: InputMaybe<Bigint_Comparison_Exp>;
  current_price_to_highest_sales_price_pct?: InputMaybe<Bigint_Comparison_Exp>;
  current_price_to_last_sales_price_diff?: InputMaybe<Bigint_Comparison_Exp>;
  current_price_to_last_sales_price_pct?: InputMaybe<Bigint_Comparison_Exp>;
  current_price_to_lowest_sales_price_diff?: InputMaybe<Bigint_Comparison_Exp>;
  current_price_to_lowest_sales_price_pct?: InputMaybe<Bigint_Comparison_Exp>;
  description?: InputMaybe<String_Comparison_Exp>;
  display_uri?: InputMaybe<String_Comparison_Exp>;
  editions?: InputMaybe<Bigint_Comparison_Exp>;
  eightbid_creator_name?: InputMaybe<String_Comparison_Exp>;
  eightbid_rgb?: InputMaybe<String_Comparison_Exp>;
  eightscribo_rowone?: InputMaybe<String_Comparison_Exp>;
  eightscribo_rowthree?: InputMaybe<String_Comparison_Exp>;
  eightscribo_rowtwo?: InputMaybe<String_Comparison_Exp>;
  eightscribo_title?: InputMaybe<String_Comparison_Exp>;
  events?: InputMaybe<Events_Bool_Exp>;
  external_uri?: InputMaybe<String_Comparison_Exp>;
  fa2_address?: InputMaybe<String_Comparison_Exp>;
  first_sales_price?: InputMaybe<Bigint_Comparison_Exp>;
  formats?: InputMaybe<Jsonb_Comparison_Exp>;
  fx_collection_description?: InputMaybe<String_Comparison_Exp>;
  fx_collection_display_uri?: InputMaybe<String_Comparison_Exp>;
  fx_collection_editions?: InputMaybe<Bigint_Comparison_Exp>;
  fx_collection_name?: InputMaybe<String_Comparison_Exp>;
  fx_collection_thumbnail_uri?: InputMaybe<String_Comparison_Exp>;
  fx_issuer_id?: InputMaybe<Bigint_Comparison_Exp>;
  fx_iteration?: InputMaybe<Bigint_Comparison_Exp>;
  highest_offer_price?: InputMaybe<Bigint_Comparison_Exp>;
  highest_sales_price?: InputMaybe<Bigint_Comparison_Exp>;
  holdings?: InputMaybe<Holdings_Bool_Exp>;
  last_processed_event_id?: InputMaybe<String_Comparison_Exp>;
  last_processed_event_level?: InputMaybe<Bigint_Comparison_Exp>;
  last_processed_event_timestamp?: InputMaybe<Timestamptz_Comparison_Exp>;
  last_sale_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  last_sales_price?: InputMaybe<Bigint_Comparison_Exp>;
  listings?: InputMaybe<Listings_Bool_Exp>;
  lowest_sales_price?: InputMaybe<Bigint_Comparison_Exp>;
  metadata_status?: InputMaybe<String_Comparison_Exp>;
  metadata_uri?: InputMaybe<String_Comparison_Exp>;
  mime_type?: InputMaybe<String_Comparison_Exp>;
  mint_price?: InputMaybe<Bigint_Comparison_Exp>;
  minted_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  minter_address?: InputMaybe<String_Comparison_Exp>;
  minter_profile?: InputMaybe<Tzprofiles_Bool_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  objkt_artist_collection_id?: InputMaybe<Bigint_Comparison_Exp>;
  offers?: InputMaybe<Offers_Bool_Exp>;
  platform?: InputMaybe<String_Comparison_Exp>;
  price?: InputMaybe<Bigint_Comparison_Exp>;
  right_uri?: InputMaybe<String_Comparison_Exp>;
  rights?: InputMaybe<String_Comparison_Exp>;
  royalties?: InputMaybe<Jsonb_Comparison_Exp>;
  royalties_total?: InputMaybe<Bigint_Comparison_Exp>;
  royalty_receivers?: InputMaybe<Royalty_Receivers_Bool_Exp>;
  sales_count?: InputMaybe<Bigint_Comparison_Exp>;
  sales_volume?: InputMaybe<Bigint_Comparison_Exp>;
  symbol?: InputMaybe<String_Comparison_Exp>;
  tags?: InputMaybe<Tags_Bool_Exp>;
  thumbnail_uri?: InputMaybe<String_Comparison_Exp>;
  token_id?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Tokens_Max_Fields = {
  __typename?: 'tokens_max_fields';
  artifact_uri?: Maybe<Scalars['String']>;
  artist_address?: Maybe<Scalars['String']>;
  burned_editions?: Maybe<Scalars['bigint']>;
  current_price_to_first_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_first_sales_price_pct?: Maybe<Scalars['bigint']>;
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['bigint']>;
  current_price_to_last_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_last_sales_price_pct?: Maybe<Scalars['bigint']>;
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['bigint']>;
  description?: Maybe<Scalars['String']>;
  display_uri?: Maybe<Scalars['String']>;
  editions?: Maybe<Scalars['bigint']>;
  eightbid_creator_name?: Maybe<Scalars['String']>;
  eightbid_rgb?: Maybe<Scalars['String']>;
  eightscribo_rowone?: Maybe<Scalars['String']>;
  eightscribo_rowthree?: Maybe<Scalars['String']>;
  eightscribo_rowtwo?: Maybe<Scalars['String']>;
  eightscribo_title?: Maybe<Scalars['String']>;
  external_uri?: Maybe<Scalars['String']>;
  fa2_address?: Maybe<Scalars['String']>;
  first_sales_price?: Maybe<Scalars['bigint']>;
  fx_collection_description?: Maybe<Scalars['String']>;
  fx_collection_display_uri?: Maybe<Scalars['String']>;
  fx_collection_editions?: Maybe<Scalars['bigint']>;
  fx_collection_name?: Maybe<Scalars['String']>;
  fx_collection_thumbnail_uri?: Maybe<Scalars['String']>;
  fx_issuer_id?: Maybe<Scalars['bigint']>;
  fx_iteration?: Maybe<Scalars['bigint']>;
  highest_offer_price?: Maybe<Scalars['bigint']>;
  highest_sales_price?: Maybe<Scalars['bigint']>;
  last_processed_event_id?: Maybe<Scalars['String']>;
  last_processed_event_level?: Maybe<Scalars['bigint']>;
  last_processed_event_timestamp?: Maybe<Scalars['timestamptz']>;
  last_sale_at?: Maybe<Scalars['timestamptz']>;
  last_sales_price?: Maybe<Scalars['bigint']>;
  lowest_sales_price?: Maybe<Scalars['bigint']>;
  metadata_status?: Maybe<Scalars['String']>;
  metadata_uri?: Maybe<Scalars['String']>;
  mime_type?: Maybe<Scalars['String']>;
  mint_price?: Maybe<Scalars['bigint']>;
  minted_at?: Maybe<Scalars['timestamptz']>;
  minter_address?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  objkt_artist_collection_id?: Maybe<Scalars['bigint']>;
  platform?: Maybe<Scalars['String']>;
  price?: Maybe<Scalars['bigint']>;
  right_uri?: Maybe<Scalars['String']>;
  rights?: Maybe<Scalars['String']>;
  royalties_total?: Maybe<Scalars['bigint']>;
  sales_count?: Maybe<Scalars['bigint']>;
  sales_volume?: Maybe<Scalars['bigint']>;
  symbol?: Maybe<Scalars['String']>;
  thumbnail_uri?: Maybe<Scalars['String']>;
  token_id?: Maybe<Scalars['String']>;
};

/** aggregate min on columns */
export type Tokens_Min_Fields = {
  __typename?: 'tokens_min_fields';
  artifact_uri?: Maybe<Scalars['String']>;
  artist_address?: Maybe<Scalars['String']>;
  burned_editions?: Maybe<Scalars['bigint']>;
  current_price_to_first_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_first_sales_price_pct?: Maybe<Scalars['bigint']>;
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['bigint']>;
  current_price_to_last_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_last_sales_price_pct?: Maybe<Scalars['bigint']>;
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['bigint']>;
  description?: Maybe<Scalars['String']>;
  display_uri?: Maybe<Scalars['String']>;
  editions?: Maybe<Scalars['bigint']>;
  eightbid_creator_name?: Maybe<Scalars['String']>;
  eightbid_rgb?: Maybe<Scalars['String']>;
  eightscribo_rowone?: Maybe<Scalars['String']>;
  eightscribo_rowthree?: Maybe<Scalars['String']>;
  eightscribo_rowtwo?: Maybe<Scalars['String']>;
  eightscribo_title?: Maybe<Scalars['String']>;
  external_uri?: Maybe<Scalars['String']>;
  fa2_address?: Maybe<Scalars['String']>;
  first_sales_price?: Maybe<Scalars['bigint']>;
  fx_collection_description?: Maybe<Scalars['String']>;
  fx_collection_display_uri?: Maybe<Scalars['String']>;
  fx_collection_editions?: Maybe<Scalars['bigint']>;
  fx_collection_name?: Maybe<Scalars['String']>;
  fx_collection_thumbnail_uri?: Maybe<Scalars['String']>;
  fx_issuer_id?: Maybe<Scalars['bigint']>;
  fx_iteration?: Maybe<Scalars['bigint']>;
  highest_offer_price?: Maybe<Scalars['bigint']>;
  highest_sales_price?: Maybe<Scalars['bigint']>;
  last_processed_event_id?: Maybe<Scalars['String']>;
  last_processed_event_level?: Maybe<Scalars['bigint']>;
  last_processed_event_timestamp?: Maybe<Scalars['timestamptz']>;
  last_sale_at?: Maybe<Scalars['timestamptz']>;
  last_sales_price?: Maybe<Scalars['bigint']>;
  lowest_sales_price?: Maybe<Scalars['bigint']>;
  metadata_status?: Maybe<Scalars['String']>;
  metadata_uri?: Maybe<Scalars['String']>;
  mime_type?: Maybe<Scalars['String']>;
  mint_price?: Maybe<Scalars['bigint']>;
  minted_at?: Maybe<Scalars['timestamptz']>;
  minter_address?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  objkt_artist_collection_id?: Maybe<Scalars['bigint']>;
  platform?: Maybe<Scalars['String']>;
  price?: Maybe<Scalars['bigint']>;
  right_uri?: Maybe<Scalars['String']>;
  rights?: Maybe<Scalars['String']>;
  royalties_total?: Maybe<Scalars['bigint']>;
  sales_count?: Maybe<Scalars['bigint']>;
  sales_volume?: Maybe<Scalars['bigint']>;
  symbol?: Maybe<Scalars['String']>;
  thumbnail_uri?: Maybe<Scalars['String']>;
  token_id?: Maybe<Scalars['String']>;
};

/** Ordering options when selecting data from "tokens". */
export type Tokens_Order_By = {
  artifact_metadata?: InputMaybe<Order_By>;
  artifact_uri?: InputMaybe<Order_By>;
  artist_address?: InputMaybe<Order_By>;
  artist_profile?: InputMaybe<Tzprofiles_Order_By>;
  assets?: InputMaybe<Order_By>;
  attributes?: InputMaybe<Order_By>;
  burned_editions?: InputMaybe<Order_By>;
  contributors?: InputMaybe<Order_By>;
  creators?: InputMaybe<Order_By>;
  current_price_to_first_sales_price_diff?: InputMaybe<Order_By>;
  current_price_to_first_sales_price_pct?: InputMaybe<Order_By>;
  current_price_to_highest_sales_price_diff?: InputMaybe<Order_By>;
  current_price_to_highest_sales_price_pct?: InputMaybe<Order_By>;
  current_price_to_last_sales_price_diff?: InputMaybe<Order_By>;
  current_price_to_last_sales_price_pct?: InputMaybe<Order_By>;
  current_price_to_lowest_sales_price_diff?: InputMaybe<Order_By>;
  current_price_to_lowest_sales_price_pct?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  display_uri?: InputMaybe<Order_By>;
  editions?: InputMaybe<Order_By>;
  eightbid_creator_name?: InputMaybe<Order_By>;
  eightbid_rgb?: InputMaybe<Order_By>;
  eightscribo_rowone?: InputMaybe<Order_By>;
  eightscribo_rowthree?: InputMaybe<Order_By>;
  eightscribo_rowtwo?: InputMaybe<Order_By>;
  eightscribo_title?: InputMaybe<Order_By>;
  events_aggregate?: InputMaybe<Events_Aggregate_Order_By>;
  external_uri?: InputMaybe<Order_By>;
  fa2_address?: InputMaybe<Order_By>;
  first_sales_price?: InputMaybe<Order_By>;
  formats?: InputMaybe<Order_By>;
  fx_collection_description?: InputMaybe<Order_By>;
  fx_collection_display_uri?: InputMaybe<Order_By>;
  fx_collection_editions?: InputMaybe<Order_By>;
  fx_collection_name?: InputMaybe<Order_By>;
  fx_collection_thumbnail_uri?: InputMaybe<Order_By>;
  fx_issuer_id?: InputMaybe<Order_By>;
  fx_iteration?: InputMaybe<Order_By>;
  highest_offer_price?: InputMaybe<Order_By>;
  highest_sales_price?: InputMaybe<Order_By>;
  holdings_aggregate?: InputMaybe<Holdings_Aggregate_Order_By>;
  last_processed_event_id?: InputMaybe<Order_By>;
  last_processed_event_level?: InputMaybe<Order_By>;
  last_processed_event_timestamp?: InputMaybe<Order_By>;
  last_sale_at?: InputMaybe<Order_By>;
  last_sales_price?: InputMaybe<Order_By>;
  listings_aggregate?: InputMaybe<Listings_Aggregate_Order_By>;
  lowest_sales_price?: InputMaybe<Order_By>;
  metadata_status?: InputMaybe<Order_By>;
  metadata_uri?: InputMaybe<Order_By>;
  mime_type?: InputMaybe<Order_By>;
  mint_price?: InputMaybe<Order_By>;
  minted_at?: InputMaybe<Order_By>;
  minter_address?: InputMaybe<Order_By>;
  minter_profile?: InputMaybe<Tzprofiles_Order_By>;
  name?: InputMaybe<Order_By>;
  objkt_artist_collection_id?: InputMaybe<Order_By>;
  offers_aggregate?: InputMaybe<Offers_Aggregate_Order_By>;
  platform?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  right_uri?: InputMaybe<Order_By>;
  rights?: InputMaybe<Order_By>;
  royalties?: InputMaybe<Order_By>;
  royalties_total?: InputMaybe<Order_By>;
  royalty_receivers_aggregate?: InputMaybe<Royalty_Receivers_Aggregate_Order_By>;
  sales_count?: InputMaybe<Order_By>;
  sales_volume?: InputMaybe<Order_By>;
  symbol?: InputMaybe<Order_By>;
  tags_aggregate?: InputMaybe<Tags_Aggregate_Order_By>;
  thumbnail_uri?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** select columns of table "tokens" */
export enum Tokens_Select_Column {
  /** column name */
  ArtifactMetadata = 'artifact_metadata',
  /** column name */
  ArtifactUri = 'artifact_uri',
  /** column name */
  ArtistAddress = 'artist_address',
  /** column name */
  Assets = 'assets',
  /** column name */
  Attributes = 'attributes',
  /** column name */
  BurnedEditions = 'burned_editions',
  /** column name */
  Contributors = 'contributors',
  /** column name */
  Creators = 'creators',
  /** column name */
  CurrentPriceToFirstSalesPriceDiff = 'current_price_to_first_sales_price_diff',
  /** column name */
  CurrentPriceToFirstSalesPricePct = 'current_price_to_first_sales_price_pct',
  /** column name */
  CurrentPriceToHighestSalesPriceDiff = 'current_price_to_highest_sales_price_diff',
  /** column name */
  CurrentPriceToHighestSalesPricePct = 'current_price_to_highest_sales_price_pct',
  /** column name */
  CurrentPriceToLastSalesPriceDiff = 'current_price_to_last_sales_price_diff',
  /** column name */
  CurrentPriceToLastSalesPricePct = 'current_price_to_last_sales_price_pct',
  /** column name */
  CurrentPriceToLowestSalesPriceDiff = 'current_price_to_lowest_sales_price_diff',
  /** column name */
  CurrentPriceToLowestSalesPricePct = 'current_price_to_lowest_sales_price_pct',
  /** column name */
  Description = 'description',
  /** column name */
  DisplayUri = 'display_uri',
  /** column name */
  Editions = 'editions',
  /** column name */
  EightbidCreatorName = 'eightbid_creator_name',
  /** column name */
  EightbidRgb = 'eightbid_rgb',
  /** column name */
  EightscriboRowone = 'eightscribo_rowone',
  /** column name */
  EightscriboRowthree = 'eightscribo_rowthree',
  /** column name */
  EightscriboRowtwo = 'eightscribo_rowtwo',
  /** column name */
  EightscriboTitle = 'eightscribo_title',
  /** column name */
  ExternalUri = 'external_uri',
  /** column name */
  Fa2Address = 'fa2_address',
  /** column name */
  FirstSalesPrice = 'first_sales_price',
  /** column name */
  Formats = 'formats',
  /** column name */
  FxCollectionDescription = 'fx_collection_description',
  /** column name */
  FxCollectionDisplayUri = 'fx_collection_display_uri',
  /** column name */
  FxCollectionEditions = 'fx_collection_editions',
  /** column name */
  FxCollectionName = 'fx_collection_name',
  /** column name */
  FxCollectionThumbnailUri = 'fx_collection_thumbnail_uri',
  /** column name */
  FxIssuerId = 'fx_issuer_id',
  /** column name */
  FxIteration = 'fx_iteration',
  /** column name */
  HighestOfferPrice = 'highest_offer_price',
  /** column name */
  HighestSalesPrice = 'highest_sales_price',
  /** column name */
  LastProcessedEventId = 'last_processed_event_id',
  /** column name */
  LastProcessedEventLevel = 'last_processed_event_level',
  /** column name */
  LastProcessedEventTimestamp = 'last_processed_event_timestamp',
  /** column name */
  LastSaleAt = 'last_sale_at',
  /** column name */
  LastSalesPrice = 'last_sales_price',
  /** column name */
  LowestSalesPrice = 'lowest_sales_price',
  /** column name */
  MetadataStatus = 'metadata_status',
  /** column name */
  MetadataUri = 'metadata_uri',
  /** column name */
  MimeType = 'mime_type',
  /** column name */
  MintPrice = 'mint_price',
  /** column name */
  MintedAt = 'minted_at',
  /** column name */
  MinterAddress = 'minter_address',
  /** column name */
  Name = 'name',
  /** column name */
  ObjktArtistCollectionId = 'objkt_artist_collection_id',
  /** column name */
  Platform = 'platform',
  /** column name */
  Price = 'price',
  /** column name */
  RightUri = 'right_uri',
  /** column name */
  Rights = 'rights',
  /** column name */
  Royalties = 'royalties',
  /** column name */
  RoyaltiesTotal = 'royalties_total',
  /** column name */
  SalesCount = 'sales_count',
  /** column name */
  SalesVolume = 'sales_volume',
  /** column name */
  Symbol = 'symbol',
  /** column name */
  ThumbnailUri = 'thumbnail_uri',
  /** column name */
  TokenId = 'token_id'
}

/** aggregate stddev on columns */
export type Tokens_Stddev_Fields = {
  __typename?: 'tokens_stddev_fields';
  burned_editions?: Maybe<Scalars['Float']>;
  current_price_to_first_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_first_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_last_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_last_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['Float']>;
  editions?: Maybe<Scalars['Float']>;
  first_sales_price?: Maybe<Scalars['Float']>;
  fx_collection_editions?: Maybe<Scalars['Float']>;
  fx_issuer_id?: Maybe<Scalars['Float']>;
  fx_iteration?: Maybe<Scalars['Float']>;
  highest_offer_price?: Maybe<Scalars['Float']>;
  highest_sales_price?: Maybe<Scalars['Float']>;
  last_processed_event_level?: Maybe<Scalars['Float']>;
  last_sales_price?: Maybe<Scalars['Float']>;
  lowest_sales_price?: Maybe<Scalars['Float']>;
  mint_price?: Maybe<Scalars['Float']>;
  objkt_artist_collection_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  royalties_total?: Maybe<Scalars['Float']>;
  sales_count?: Maybe<Scalars['Float']>;
  sales_volume?: Maybe<Scalars['Float']>;
};

/** aggregate stddev_pop on columns */
export type Tokens_Stddev_Pop_Fields = {
  __typename?: 'tokens_stddev_pop_fields';
  burned_editions?: Maybe<Scalars['Float']>;
  current_price_to_first_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_first_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_last_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_last_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['Float']>;
  editions?: Maybe<Scalars['Float']>;
  first_sales_price?: Maybe<Scalars['Float']>;
  fx_collection_editions?: Maybe<Scalars['Float']>;
  fx_issuer_id?: Maybe<Scalars['Float']>;
  fx_iteration?: Maybe<Scalars['Float']>;
  highest_offer_price?: Maybe<Scalars['Float']>;
  highest_sales_price?: Maybe<Scalars['Float']>;
  last_processed_event_level?: Maybe<Scalars['Float']>;
  last_sales_price?: Maybe<Scalars['Float']>;
  lowest_sales_price?: Maybe<Scalars['Float']>;
  mint_price?: Maybe<Scalars['Float']>;
  objkt_artist_collection_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  royalties_total?: Maybe<Scalars['Float']>;
  sales_count?: Maybe<Scalars['Float']>;
  sales_volume?: Maybe<Scalars['Float']>;
};

/** aggregate stddev_samp on columns */
export type Tokens_Stddev_Samp_Fields = {
  __typename?: 'tokens_stddev_samp_fields';
  burned_editions?: Maybe<Scalars['Float']>;
  current_price_to_first_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_first_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_last_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_last_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['Float']>;
  editions?: Maybe<Scalars['Float']>;
  first_sales_price?: Maybe<Scalars['Float']>;
  fx_collection_editions?: Maybe<Scalars['Float']>;
  fx_issuer_id?: Maybe<Scalars['Float']>;
  fx_iteration?: Maybe<Scalars['Float']>;
  highest_offer_price?: Maybe<Scalars['Float']>;
  highest_sales_price?: Maybe<Scalars['Float']>;
  last_processed_event_level?: Maybe<Scalars['Float']>;
  last_sales_price?: Maybe<Scalars['Float']>;
  lowest_sales_price?: Maybe<Scalars['Float']>;
  mint_price?: Maybe<Scalars['Float']>;
  objkt_artist_collection_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  royalties_total?: Maybe<Scalars['Float']>;
  sales_count?: Maybe<Scalars['Float']>;
  sales_volume?: Maybe<Scalars['Float']>;
};

/** aggregate sum on columns */
export type Tokens_Sum_Fields = {
  __typename?: 'tokens_sum_fields';
  burned_editions?: Maybe<Scalars['bigint']>;
  current_price_to_first_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_first_sales_price_pct?: Maybe<Scalars['bigint']>;
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['bigint']>;
  current_price_to_last_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_last_sales_price_pct?: Maybe<Scalars['bigint']>;
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['bigint']>;
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['bigint']>;
  editions?: Maybe<Scalars['bigint']>;
  first_sales_price?: Maybe<Scalars['bigint']>;
  fx_collection_editions?: Maybe<Scalars['bigint']>;
  fx_issuer_id?: Maybe<Scalars['bigint']>;
  fx_iteration?: Maybe<Scalars['bigint']>;
  highest_offer_price?: Maybe<Scalars['bigint']>;
  highest_sales_price?: Maybe<Scalars['bigint']>;
  last_processed_event_level?: Maybe<Scalars['bigint']>;
  last_sales_price?: Maybe<Scalars['bigint']>;
  lowest_sales_price?: Maybe<Scalars['bigint']>;
  mint_price?: Maybe<Scalars['bigint']>;
  objkt_artist_collection_id?: Maybe<Scalars['bigint']>;
  price?: Maybe<Scalars['bigint']>;
  royalties_total?: Maybe<Scalars['bigint']>;
  sales_count?: Maybe<Scalars['bigint']>;
  sales_volume?: Maybe<Scalars['bigint']>;
};

/** aggregate var_pop on columns */
export type Tokens_Var_Pop_Fields = {
  __typename?: 'tokens_var_pop_fields';
  burned_editions?: Maybe<Scalars['Float']>;
  current_price_to_first_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_first_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_last_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_last_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['Float']>;
  editions?: Maybe<Scalars['Float']>;
  first_sales_price?: Maybe<Scalars['Float']>;
  fx_collection_editions?: Maybe<Scalars['Float']>;
  fx_issuer_id?: Maybe<Scalars['Float']>;
  fx_iteration?: Maybe<Scalars['Float']>;
  highest_offer_price?: Maybe<Scalars['Float']>;
  highest_sales_price?: Maybe<Scalars['Float']>;
  last_processed_event_level?: Maybe<Scalars['Float']>;
  last_sales_price?: Maybe<Scalars['Float']>;
  lowest_sales_price?: Maybe<Scalars['Float']>;
  mint_price?: Maybe<Scalars['Float']>;
  objkt_artist_collection_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  royalties_total?: Maybe<Scalars['Float']>;
  sales_count?: Maybe<Scalars['Float']>;
  sales_volume?: Maybe<Scalars['Float']>;
};

/** aggregate var_samp on columns */
export type Tokens_Var_Samp_Fields = {
  __typename?: 'tokens_var_samp_fields';
  burned_editions?: Maybe<Scalars['Float']>;
  current_price_to_first_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_first_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_last_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_last_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['Float']>;
  editions?: Maybe<Scalars['Float']>;
  first_sales_price?: Maybe<Scalars['Float']>;
  fx_collection_editions?: Maybe<Scalars['Float']>;
  fx_issuer_id?: Maybe<Scalars['Float']>;
  fx_iteration?: Maybe<Scalars['Float']>;
  highest_offer_price?: Maybe<Scalars['Float']>;
  highest_sales_price?: Maybe<Scalars['Float']>;
  last_processed_event_level?: Maybe<Scalars['Float']>;
  last_sales_price?: Maybe<Scalars['Float']>;
  lowest_sales_price?: Maybe<Scalars['Float']>;
  mint_price?: Maybe<Scalars['Float']>;
  objkt_artist_collection_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  royalties_total?: Maybe<Scalars['Float']>;
  sales_count?: Maybe<Scalars['Float']>;
  sales_volume?: Maybe<Scalars['Float']>;
};

/** aggregate variance on columns */
export type Tokens_Variance_Fields = {
  __typename?: 'tokens_variance_fields';
  burned_editions?: Maybe<Scalars['Float']>;
  current_price_to_first_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_first_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_highest_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_highest_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_last_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_last_sales_price_pct?: Maybe<Scalars['Float']>;
  current_price_to_lowest_sales_price_diff?: Maybe<Scalars['Float']>;
  current_price_to_lowest_sales_price_pct?: Maybe<Scalars['Float']>;
  editions?: Maybe<Scalars['Float']>;
  first_sales_price?: Maybe<Scalars['Float']>;
  fx_collection_editions?: Maybe<Scalars['Float']>;
  fx_issuer_id?: Maybe<Scalars['Float']>;
  fx_iteration?: Maybe<Scalars['Float']>;
  highest_offer_price?: Maybe<Scalars['Float']>;
  highest_sales_price?: Maybe<Scalars['Float']>;
  last_processed_event_level?: Maybe<Scalars['Float']>;
  last_sales_price?: Maybe<Scalars['Float']>;
  lowest_sales_price?: Maybe<Scalars['Float']>;
  mint_price?: Maybe<Scalars['Float']>;
  objkt_artist_collection_id?: Maybe<Scalars['Float']>;
  price?: Maybe<Scalars['Float']>;
  royalties_total?: Maybe<Scalars['Float']>;
  sales_count?: Maybe<Scalars['Float']>;
  sales_volume?: Maybe<Scalars['Float']>;
};

/** columns and relationships of "tzprofiles.tzprofiles" */
export type Tzprofiles = {
  __typename?: 'tzprofiles';
  account: Scalars['String'];
  alias?: Maybe<Scalars['String']>;
  contract: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  discord?: Maybe<Scalars['String']>;
  domain_name?: Maybe<Scalars['String']>;
  ethereum?: Maybe<Scalars['String']>;
  github?: Maybe<Scalars['String']>;
  logo?: Maybe<Scalars['String']>;
  twitter?: Maybe<Scalars['String']>;
  website?: Maybe<Scalars['String']>;
};

/** aggregated selection of "tzprofiles.tzprofiles" */
export type Tzprofiles_Aggregate = {
  __typename?: 'tzprofiles_aggregate';
  aggregate?: Maybe<Tzprofiles_Aggregate_Fields>;
  nodes: Array<Tzprofiles>;
};

/** aggregate fields of "tzprofiles.tzprofiles" */
export type Tzprofiles_Aggregate_Fields = {
  __typename?: 'tzprofiles_aggregate_fields';
  count: Scalars['Int'];
  max?: Maybe<Tzprofiles_Max_Fields>;
  min?: Maybe<Tzprofiles_Min_Fields>;
};

/** aggregate fields of "tzprofiles.tzprofiles" */
export type Tzprofiles_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Tzprofiles_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** Boolean expression to filter rows from the table "tzprofiles.tzprofiles". All fields are combined with a logical 'AND'. */
export type Tzprofiles_Bool_Exp = {
  _and?: InputMaybe<Array<Tzprofiles_Bool_Exp>>;
  _not?: InputMaybe<Tzprofiles_Bool_Exp>;
  _or?: InputMaybe<Array<Tzprofiles_Bool_Exp>>;
  account?: InputMaybe<String_Comparison_Exp>;
  alias?: InputMaybe<String_Comparison_Exp>;
  contract?: InputMaybe<String_Comparison_Exp>;
  description?: InputMaybe<String_Comparison_Exp>;
  discord?: InputMaybe<String_Comparison_Exp>;
  domain_name?: InputMaybe<String_Comparison_Exp>;
  ethereum?: InputMaybe<String_Comparison_Exp>;
  github?: InputMaybe<String_Comparison_Exp>;
  logo?: InputMaybe<String_Comparison_Exp>;
  twitter?: InputMaybe<String_Comparison_Exp>;
  website?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Tzprofiles_Max_Fields = {
  __typename?: 'tzprofiles_max_fields';
  account?: Maybe<Scalars['String']>;
  alias?: Maybe<Scalars['String']>;
  contract?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  discord?: Maybe<Scalars['String']>;
  domain_name?: Maybe<Scalars['String']>;
  ethereum?: Maybe<Scalars['String']>;
  github?: Maybe<Scalars['String']>;
  logo?: Maybe<Scalars['String']>;
  twitter?: Maybe<Scalars['String']>;
  website?: Maybe<Scalars['String']>;
};

/** aggregate min on columns */
export type Tzprofiles_Min_Fields = {
  __typename?: 'tzprofiles_min_fields';
  account?: Maybe<Scalars['String']>;
  alias?: Maybe<Scalars['String']>;
  contract?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  discord?: Maybe<Scalars['String']>;
  domain_name?: Maybe<Scalars['String']>;
  ethereum?: Maybe<Scalars['String']>;
  github?: Maybe<Scalars['String']>;
  logo?: Maybe<Scalars['String']>;
  twitter?: Maybe<Scalars['String']>;
  website?: Maybe<Scalars['String']>;
};

/** Ordering options when selecting data from "tzprofiles.tzprofiles". */
export type Tzprofiles_Order_By = {
  account?: InputMaybe<Order_By>;
  alias?: InputMaybe<Order_By>;
  contract?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  discord?: InputMaybe<Order_By>;
  domain_name?: InputMaybe<Order_By>;
  ethereum?: InputMaybe<Order_By>;
  github?: InputMaybe<Order_By>;
  logo?: InputMaybe<Order_By>;
  twitter?: InputMaybe<Order_By>;
  website?: InputMaybe<Order_By>;
};

/** select columns of table "tzprofiles.tzprofiles" */
export enum Tzprofiles_Select_Column {
  /** column name */
  Account = 'account',
  /** column name */
  Alias = 'alias',
  /** column name */
  Contract = 'contract',
  /** column name */
  Description = 'description',
  /** column name */
  Discord = 'discord',
  /** column name */
  DomainName = 'domain_name',
  /** column name */
  Ethereum = 'ethereum',
  /** column name */
  Github = 'github',
  /** column name */
  Logo = 'logo',
  /** column name */
  Twitter = 'twitter',
  /** column name */
  Website = 'website'
}

export type LatestEventsQueryVariables = Exact<{
  account: Scalars['String'];
}>;

export type LatestEventsQuery = {
  __typename?: 'query_root';
  events: Array<{
    __typename?: 'events';
    type?: string | null;
    timestamp: any;
    amount?: any | null;
    owner_address?: string | null;
    from_address?: string | null;
    to_address?: string | null;
    bidder_address?: string | null;
    buyer_address?: string | null;
    seller_address?: string | null;
    artist_address?: string | null;
    opid: any;
    ophash?: string | null;
    token?: {
      __typename?: 'tokens';
      fa2_address: string;
      token_id: string;
      artist_address?: string | null;
      symbol?: string | null;
      name?: string | null;
      description?: string | null;
      price?: any | null;
      royalties?: any | null;
      royalties_total?: any | null;
    } | null;
  }>;
};

export const LatestEventsDocument = gql`
  query LatestEvents($account: String!) {
    events(
      limit: 100
      where: {
        token: { metadata_status: { _eq: "processed" } }
        _and: {
          _or: [
            { artist_address: { _eq: $account } }
            { owner_address: { _eq: $account } }
            { buyer_address: { _eq: $account } }
            { seller_address: { _eq: $account } }
            { from_address: { _eq: $account } }
            { to_address: { _eq: $account } }
          ]
        }
      }
      order_by: { opid: desc }
    ) {
      type
      timestamp
      token {
        fa2_address
        token_id
        artist_address
        symbol
        name
        description
        price
        royalties
        royalties_total
      }
      amount
      owner_address
      from_address
      to_address
      bidder_address
      buyer_address
      seller_address
      artist_address
      opid
      ophash
    }
  }
`;

/**
 * __useLatestEventsQuery__
 *
 * To run a query within a React component, call `useLatestEventsQuery` and pass it any options that fit your needs.
 * When your component renders, `useLatestEventsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLatestEventsQuery({
 *   variables: {
 *      account: // value for 'account'
 *   },
 * });
 */
export function useLatestEventsQuery(
  baseOptions: Apollo.QueryHookOptions<LatestEventsQuery, LatestEventsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<LatestEventsQuery, LatestEventsQueryVariables>(LatestEventsDocument, options);
}
export function useLatestEventsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<LatestEventsQuery, LatestEventsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<LatestEventsQuery, LatestEventsQueryVariables>(LatestEventsDocument, options);
}
export type LatestEventsQueryHookResult = ReturnType<typeof useLatestEventsQuery>;
export type LatestEventsLazyQueryHookResult = ReturnType<typeof useLatestEventsLazyQuery>;
export type LatestEventsQueryResult = Apollo.QueryResult<LatestEventsQuery, LatestEventsQueryVariables>;
