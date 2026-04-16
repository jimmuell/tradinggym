import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';

// ---------- Mocks ----------

const mockNavigate = vi.fn();
const mockUseParams = vi.fn(() => ({ id: 'new' }));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    session: { user: { id: 'test-user-id' } },
    loading: false,
    signOut: vi.fn(),
  }),
}));

let mockCurrentTier = 'foundation';
vi.mock('@/contexts/TierContext', () => ({
  useTier: () => ({
    currentTier: mockCurrentTier,
    isUnlocked: (tier: string) => {
      const order = ['foundation', 'tier1', 'tier2', 'tier3', 'coach'];
      return order.indexOf(mockCurrentTier) >= order.indexOf(tier);
    },
    canAccess: () => true,
    setTierState: vi.fn(),
    loading: false,
  }),
  TierProvider: ({ children }: { children: React.ReactNode }) => children,
}));

type ChainResult = { data: null; error: null };
type Chain = {
  select: (...args: string[]) => Chain;
  eq: () => Chain;
  order: () => Chain;
  maybeSingle: () => Chain;
  single: () => Chain;
  insert: () => Chain;
  update: () => Chain;
  delete: () => Chain;
  then: (resolve: (result: ChainResult) => void) => void;
};

const mockSelect = vi.fn();
vi.mock('@/integrations/supabase/client', () => {
  const chainable = (): Chain => {
    const chain: Chain = {
      select: (...args: string[]) => { mockSelect(...args); return chain; },
      eq: () => chain,
      order: () => chain,
      maybeSingle: () => chain,
      single: () => chain,
      insert: () => chain,
      update: () => chain,
      delete: () => chain,
      then: (resolve: (result: ChainResult) => void) => resolve({ data: null, error: null }),
    };
    return chain;
  };
  return {
    supabase: {
      from: () => chainable(),
      auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
    },
  };
});

// ---------- Helpers ----------

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TooltipProvider>{children}</TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ---------- Tier lock tests (Strategies page) ----------

type QueryOpts = { queryKey?: string[] };

const mockSystemStrategies = [
  {
    id: '1',
    user_id: null,
    name: 'Breakout Strategy',
    description: 'A tier1 breakout strategy',
    instrument: 'MES',
    timeframe: '5m',
    direction_bias: 'Long',
    entry_rules: null,
    exit_rules: null,
    notes: null,
    is_system: true,
    tier_required: 'tier1',
    created_at: '2024-01-01',
  },
  {
    id: '2',
    user_id: null,
    name: 'Advanced Pullback',
    description: 'A tier2 pullback strategy',
    instrument: 'ES',
    timeframe: '15m',
    direction_bias: 'Both',
    entry_rules: null,
    exit_rules: null,
    notes: null,
    is_system: true,
    tier_required: 'tier2',
    created_at: '2024-01-02',
  },
];

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: (opts: QueryOpts) => {
      if (opts.queryKey?.[0] === 'strategies' && opts.queryKey?.[1] === 'system') {
        return { data: mockSystemStrategies, isLoading: false };
      }
      if (opts.queryKey?.[0] === 'strategies' && opts.queryKey?.[1] === 'user') {
        return { data: [], isLoading: false };
      }
      if (opts.queryKey?.[0] === 'strategy') {
        return { data: null, isLoading: false };
      }
      return { data: undefined, isLoading: false };
    },
    useMutation: () => ({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

// ---------- Test suites ----------

describe('Strategies — Tier lock logic', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('foundation user sees tier1 strategy locked', async () => {
    mockCurrentTier = 'foundation';
    const Strategies = (await import('@/pages/Strategies')).default;
    render(<Strategies />, { wrapper });

    expect(screen.getByText('Complete Tier 1 to unlock')).toBeInTheDocument();
    expect(screen.getByText('Complete Tier 2 to unlock')).toBeInTheDocument();
    expect(screen.queryByText('View Details')).not.toBeInTheDocument();
  });

  it('tier1 user sees tier1 strategy unlocked but tier2 still locked', async () => {
    mockCurrentTier = 'tier1';
    const Strategies = (await import('@/pages/Strategies')).default;
    render(<Strategies />, { wrapper });

    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Complete Tier 2 to unlock')).toBeInTheDocument();
  });

  it('tier2 user sees both tier1 and tier2 strategies unlocked', async () => {
    mockCurrentTier = 'tier2';
    const Strategies = (await import('@/pages/Strategies')).default;
    render(<Strategies />, { wrapper });

    const viewButtons = screen.getAllByText('View Details');
    expect(viewButtons).toHaveLength(2);
    expect(screen.queryByText(/Complete .* to unlock/)).not.toBeInTheDocument();
  });
});

describe('StrategyDetailPage — Field gating', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: 'new' });
    mockNavigate.mockClear();
  });

  it('foundation user: name/description/notes enabled, pro fields gated', async () => {
    mockCurrentTier = 'foundation';
    const StrategyDetailPage = (await import('@/pages/StrategyDetailPage')).default;
    render(<StrategyDetailPage />, { wrapper });

    const nameInput = screen.getByPlaceholderText('Strategy name');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).not.toHaveAttribute('readonly');

    const upgradeTexts = screen.getAllByText('Upgrade to Pro to unlock');
    expect(upgradeTexts).toHaveLength(5);
  });

  it('tier1 user: all fields available, no gating text', async () => {
    mockCurrentTier = 'tier1';
    const StrategyDetailPage = (await import('@/pages/StrategyDetailPage')).default;
    render(<StrategyDetailPage />, { wrapper });

    expect(screen.getByPlaceholderText('Strategy name')).toBeInTheDocument();
    expect(screen.queryByText('Upgrade to Pro to unlock')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. MES, NQ, ES')).toBeInTheDocument();
  });
});
