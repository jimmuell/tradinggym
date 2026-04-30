import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PRIVACY_SECTIONS } from '@/lib/legalContent';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <div className="space-y-8">
          {PRIVACY_SECTIONS.map((s, i) => (
            <section key={s.title}>
              <h2 className="text-xl font-semibold text-foreground mb-2">{i + 1}. {s.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
