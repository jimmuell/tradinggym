export type LegalSection = { title: string; body: string };

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: 'Acceptance of Terms',
    body: 'By creating an account on TradingGYM, you agree to be bound by these Terms of Service.',
  },
  {
    title: 'Educational Purpose Only',
    body: 'TradingGYM is for educational and simulation purposes only. It does not provide financial advice, trading signals, or investment recommendations. No real money is at risk.',
  },
  {
    title: 'No Guarantee of Results',
    body: 'Past performance in simulation does not guarantee future results. Trading futures involves substantial risk of loss.',
  },
  {
    title: 'Account Responsibilities',
    body: 'You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account.',
  },
  {
    title: 'Guru Platform',
    body: 'Trading educators ("Gurus") are independent contractors, not employees of TradingGYM. TradingGYM does not endorse or verify the accuracy of any Guru\'s content or strategies.',
  },
  {
    title: 'Subscription & Billing',
    body: 'Subscriptions are billed monthly via Stripe. You may cancel at any time through the billing portal. Refunds are handled on a case-by-case basis.',
  },
  {
    title: 'Termination',
    body: 'We reserve the right to suspend or terminate accounts that violate these terms.',
  },
  {
    title: 'Changes to Terms',
    body: 'We may update these terms at any time. Continued use of the platform constitutes acceptance of the updated terms.',
  },
  {
    title: 'Contact',
    body: 'For questions about these terms, contact us at support@tradinggym.app.',
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: 'Information We Collect',
    body: 'Email address, display name, avatar, trading simulation data, and payment information (processed by Stripe — we do not store card numbers).',
  },
  {
    title: 'How We Use Your Data',
    body: 'To provide the TradingGYM platform, process payments, improve features, and communicate service updates.',
  },
  {
    title: 'Data Sharing',
    body: 'We do not sell your personal data. We share data only with: Stripe (payments), our infrastructure provider, and your selected Guru (limited trading progress data).',
  },
  {
    title: 'Data Retention',
    body: 'Your data is retained while your account is active. You may request deletion by contacting support.',
  },
  {
    title: 'Cookies',
    body: 'We use essential cookies for authentication and preferences. No third-party tracking cookies.',
  },
  {
    title: 'Your Rights',
    body: 'You may access, update, or delete your personal data at any time through your profile settings or by contacting support.',
  },
  {
    title: 'Contact',
    body: 'For privacy inquiries, contact us at privacy@tradinggym.app.',
  },
];

export const LEGAL_LAST_UPDATED = 'April 2026';
