import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const sections = [
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

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0b0e13] text-gray-100">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <div className="space-y-8">
          {sections.map((s, i) => (
            <section key={s.title}>
              <h2 className="text-xl font-semibold text-white mb-2">{i + 1}. {s.title}</h2>
              <p className="text-gray-300 leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
