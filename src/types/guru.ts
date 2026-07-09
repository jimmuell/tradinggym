export type GuruStatus = 'pending' | 'active' | 'suspended';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type YearsExperience = 'under_1' | '1_3' | '3_5' | '5_10' | 'over_10';
export type ClassStatus = 'draft' | 'active' | 'closed';

export interface GuruProfile {
  id: string;
  user_id: string;
  bio: string | null;
  slug: string | null;
  // Sensitive Stripe columns are not exposed via the Data API to authenticated users;
  // they are only readable by service-role edge functions. Kept optional for server code.
  stripe_account_id?: string | null;
  stripe_connect_status?: 'not_started' | 'pending' | 'active' | 'restricted';
  stripe_onboarding_complete?: boolean;
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

export interface Class {
  id: string;
  guru_id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  win_rate_gate: number;
  max_students: number | null;
  status: ClassStatus;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassFormData {
  name: string;
  description: string;
  price_monthly: number;
  win_rate_gate: number;
  max_students: number | null;
  status: ClassStatus;
}

export const YEARS_EXPERIENCE_OPTIONS: { value: YearsExperience; label: string }[] = [
  { value: 'under_1', label: 'Less than 1 year' },
  { value: '1_3', label: '1–3 years' },
  { value: '3_5', label: '3–5 years' },
  { value: '5_10', label: '5–10 years' },
  { value: 'over_10', label: '10+ years' },
];

export type EnrollmentStatus = 'active' | 'paused' | 'cancelled';

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  status: EnrollmentStatus;
  stripe_subscription_id: string | null;
  enrolled_at: string;
  cancelled_at: string | null;
}

export interface StudentProfile {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  tier_state: string;
}

export interface StudentStats {
  total_trades: number;
  win_rate: number;
  wins: number;
  losses: number;
  net_pnl: number;
  meets_win_rate_gate: boolean;
}

export interface EnrolledStudent {
  enrollment: ClassEnrollment;
  profile: StudentProfile;
  class: Class;
  stats: StudentStats;
}

export interface StudentTrade {
  id: string;
  user_id: string;
  symbol: string | null;
  direction: string | null;
  result: string | null;
  pnl: number | null;
  pnl_ticks: number | null;
  steps_completed: number[] | null;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string | null;
}

export type ContentType = 'lesson' | 'post' | 'blueprint';

export interface GuruContent {
  id: string;
  guru_id: string;
  class_id: string;
  title: string;
  body: string;
  content_type: ContentType;
  is_draft: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentFormData {
  title: string;
  body: string;
  content_type: ContentType;
  class_id: string;
  is_draft: boolean;
}

export type SessionStatus = 'scheduled' | 'live' | 'ended';

export interface LiveSession {
  id: string;
  guru_id: string;
  class_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  status: SessionStatus;
  partykit_room_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionFormData {
  title: string;
  description: string;
  class_id: string;
  scheduled_at: string;
}

export interface SessionAttendance {
  id: string;
  session_id: string;
  student_id: string;
  joined_at: string;
  left_at: string | null;
}
