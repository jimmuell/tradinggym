import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const sections = [
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

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0b0e13] text-gray-100">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
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
