import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTier } from '@/contexts/TierContext';
import { useCreateCheckout } from '@/hooks/useCreateCheckout';
import { useGuruProfile, useGuruApplication } from '@/hooks/useGuruData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { YEARS_EXPERIENCE_OPTIONS, type YearsExperience } from '@/types/guru';

const GURU_PRICE_ID = 'price_REPLACE_WITH_GURU_PRICE_ID';

const formSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  trading_style: z
    .string()
    .trim()
    .min(50, 'Please describe your trading style in at least 50 characters')
    .max(2000),
  years_experience: z.enum(['under_1', '1_3', '3_5', '5_10', 'over_10']),
  what_you_teach: z
    .string()
    .trim()
    .min(100, 'Please describe what you would teach in at least 100 characters')
    .max(4000),
  existing_presence: z.string().trim().max(500).optional().or(z.literal('')),
});

export default function GuruApplyPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: guruProfile, isLoading: loadingProfile } = useGuruProfile();
  const { data: guruApplication, isLoading: loadingApp, submitApplication } =
    useGuruApplication();
  const { toast } = useToast();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    trading_style: '',
    years_experience: '' as YearsExperience | '',
    what_you_teach: '',
    existing_presence: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.email && !form.email) {
      setForm((f) => ({ ...f, email: user.email ?? '' }));
    }
  }, [user, form.email]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (guruProfile?.status === 'active') navigate('/guru');
  }, [guruProfile, navigate]);

  if (authLoading || loadingProfile || loadingApp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Application already exists → status card
  if (guruApplication) {
    return <ApplicationStatusView application={guruApplication} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        if (issue.path[0]) next[String(issue.path[0])] = issue.message;
      });
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      await submitApplication.mutateAsync({
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        trading_style: parsed.data.trading_style,
        years_experience: parsed.data.years_experience,
        what_you_teach: parsed.data.what_you_teach,
        existing_presence: parsed.data.existing_presence || undefined,
      });
      toast({ title: 'Application submitted', description: 'We\u2019ll review and get back to you.' });
    } catch {
      toast({
        title: 'Something went wrong',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl font-bold tracking-tight">TradingGYM</span>
            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/15">
              Guru Platform
            </Badge>
          </div>
          <p className="mt-3 text-muted-foreground">
            Apply to teach trading inside TradingGYM.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_320px]">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Guru application</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Field label="Full name" error={errors.full_name}>
                  <Input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    maxLength={100}
                  />
                </Field>

                <Field label="Email" error={errors.email}>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    maxLength={255}
                  />
                </Field>

                <Field
                  label="Trading style / methodology"
                  hint="Min 50 characters — e.g. ORB, VWAP scalping, SMC/ICT"
                  error={errors.trading_style}
                >
                  <Textarea
                    rows={3}
                    value={form.trading_style}
                    onChange={(e) => setForm({ ...form, trading_style: e.target.value })}
                    maxLength={2000}
                  />
                </Field>

                <Field label="Years of trading experience" error={errors.years_experience}>
                  <Select
                    value={form.years_experience}
                    onValueChange={(v) =>
                      setForm({ ...form, years_experience: v as YearsExperience })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS_EXPERIENCE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field
                  label="What you would teach"
                  hint="Min 100 characters — describe your curriculum"
                  error={errors.what_you_teach}
                >
                  <Textarea
                    rows={5}
                    value={form.what_you_teach}
                    onChange={(e) => setForm({ ...form, what_you_teach: e.target.value })}
                    maxLength={4000}
                  />
                </Field>

                <Field
                  label="Existing online presence (optional)"
                  hint="YouTube, Twitter/X, Discord, website"
                  error={errors.existing_presence}
                >
                  <Input
                    value={form.existing_presence}
                    onChange={(e) =>
                      setForm({ ...form, existing_presence: e.target.value })
                    }
                    maxLength={500}
                  />
                </Field>

                <Button
                  type="submit"
                  disabled={submitApplication.isPending}
                  className="w-full bg-amber-500 text-amber-950 hover:bg-amber-400"
                >
                  {submitApplication.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit application'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info panel */}
          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What is the Guru Platform?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  TradingGYM Gurus run their entire coaching business inside the
                  platform — no separate Discord, Whop, or LMS required. You teach,
                  TradingGYM handles the infrastructure.
                </p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span> Run your own classes
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span> Publish lessons and blueprints
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span> Earn via Stripe — keep 80% of student revenue
                  </li>
                </ul>
                <p className="border-t border-border pt-3 text-xs">
                  TradingGYM reviews all applications to maintain educator quality.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ApplicationStatusView({
  application,
}: {
  application: import('@/types/guru').GuruApplication;
}) {
  const navigate = useNavigate();
  const { planState } = useTier();
  const checkout = useCreateCheckout();
  const status = application.status;

  const config =
    status === 'pending'
      ? {
          badge: 'Application Under Review',
          badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          title: 'Thanks for applying',
          body: "We'll notify you by email once your application has been reviewed. This typically takes 2–3 business days.",
        }
      : status === 'approved'
        ? {
            badge: 'Approved',
            badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
            title: 'You\u2019re in',
            body:
              planState === 'guru'
                ? 'Your Guru account is active.'
                : 'Your application is approved! Subscribe to the Guru plan ($99/mo) to activate your dashboard.',
          }
        : {
            badge: 'Not Approved',
            badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
            title: 'Application not approved',
            body: 'Your application was not approved at this time.',
          };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 p-8 text-center">
          <Badge variant="outline" className={`${config.badgeClass} border`}>
            {config.badge}
          </Badge>
          <h2 className="text-xl font-semibold">{config.title}</h2>
          <p className="text-sm text-muted-foreground">{config.body}</p>
          {status === 'rejected' && application.reviewer_notes && (
            <p className="rounded-md border border-border bg-muted p-3 text-left text-xs text-muted-foreground">
              {application.reviewer_notes}
            </p>
          )}
          {status === 'approved' && planState !== 'guru' && (
            <Button
              onClick={() => checkout.mutate(GURU_PRICE_ID)}
              disabled={checkout.isPending}
              className="bg-amber-500 text-amber-950 hover:bg-amber-400"
            >
              {checkout.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                'Subscribe — $99/mo'
              )}
            </Button>
          )}
          {status === 'approved' && planState === 'guru' && (
            <Button
              onClick={() => navigate('/guru')}
              className="bg-amber-500 text-amber-950 hover:bg-amber-400"
            >
              Go to Guru Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
