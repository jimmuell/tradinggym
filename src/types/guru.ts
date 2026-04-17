export type GuruStatus = 'pending' | 'active' | 'suspended';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type YearsExperience = 'under_1' | '1_3' | '3_5' | '5_10' | 'over_10';
export type CohortStatus = 'draft' | 'active' | 'closed';

export interface GuruProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  slug: string | null;
  stripe_account_id: string | null;
  status: GuruStatus;
  trial_ends_at: string | null;
  trial_dismissed_count: number;
  created_at: string;
  updated_at: string;
}

export interface GuruApplication {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  trading_style: string;
  years_experience: YearsExperience;
  what_you_teach: string;
  existing_presence: string | null;
  status: ApplicationStatus;
  reviewer_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface ApplicationFormData {
  full_name: string;
  email: string;
  trading_style: string;
  years_experience: YearsExperience;
  what_you_teach: string;
  existing_presence?: string;
}

export interface Cohort {
  id: string;
  guru_id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  win_rate_gate: number;
  max_students: number | null;
  status: CohortStatus;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CohortFormData {
  name: string;
  description: string;
  price_monthly: number;
  win_rate_gate: number;
  max_students: number | null;
  status: CohortStatus;
}

export const YEARS_EXPERIENCE_OPTIONS: { value: YearsExperience; label: string }[] = [
  { value: 'under_1', label: 'Less than 1 year' },
  { value: '1_3', label: '1–3 years' },
  { value: '3_5', label: '3–5 years' },
  { value: '5_10', label: '5–10 years' },
  { value: 'over_10', label: '10+ years' },
];
