import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRole } from '@/hooks/useUserRole';

function StubShell({ title, message }: { title: string; message: string }) {
  const { isAdmin, isLoading } = useUserRole();
  if (isLoading) return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to Admin
      </Link>
      <h1 className="text-2xl font-bold">{title}</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminGurusStubPage() {
  return <StubShell title="Gurus" message="Guru application management coming soon. Use SQL editor for approvals." />;
}
export function AdminRevenueStubPage() {
  return <StubShell title="Revenue" message="Revenue dashboard coming soon. Check Stripe dashboard for current data." />;
}
