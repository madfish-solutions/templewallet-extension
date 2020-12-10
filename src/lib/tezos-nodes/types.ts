export interface TNBakerPreview {
  rank: number;
  logo: string;
  logo_min: string;
  name: string;
  address: string;
  fee: number;
  lifetime: number;
  yield: number;
  efficiency: number;
  efficiency_last10cycle: number;
  freespace: number;
  freespace_min: string;
  total_points: number;
  deletation_status: boolean;
}

export interface TNBaker {
  logo: string;
  logo_min: string;
  name: string;
  address: string;
  fee: number;
  contacts: {
    website?: TNBakerSocial;
    twitter?: TNBakerSocial;
    reddit?: TNBakerSocial;
  };
  lifetime: number;
  yield: number;
  efficiency: number;
  efficiency_last10cycle: number;
  support?: TNBakerSocial;
  projects: TNBakerSocial[];
  payouts: {
    title: string;
    icon: string;
  };
  voting: TNBakerVote[];
  freespace: number;
  deletation_status: boolean;
  total_points: number;
  pro_status: true;
  staking_balance: number;
  evaluated_balance: number;
  min_delegations_amount: number;
  last_endoresment: string;
  last_baking: string;
  next_endoresment: string;
  next_baking: string;
}

export interface TNBakerSocial {
  title: string;
  url: string;
  icon: string;
}

export interface TNBakerVote {
  proposal_name: string;
  proposal_vote: "yay" | "nay" | null;
  testing_vote: "yay" | "nay" | null;
  promotion_vote: "yay" | "nay" | null;
}
