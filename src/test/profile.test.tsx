import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Profile from '@/pages/Profile'

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: { display_name: 'Jim', avatar_url: null }, error: null })
          ),
        })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ error: null })),
  },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}))

vi.mock('@/contexts/TierContext', () => ({
  useTier: () => ({ tierState: 'foundation', isUnlocked: () => false }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderProfile() {
  const client = makeClient()
  return render(
    <QueryClientProvider client={client}>
      <Profile />
    </QueryClientProvider>
  )
}

describe('Profile — display name', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows skeleton while profile is loading', () => {
    renderProfile()
    expect(document.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('populates input with fetched display name', async () => {
    renderProfile()
    const input = await screen.findByDisplayValue('Jim')
    expect(input).toBeTruthy()
  })

  it('Save button is disabled when value is unchanged', async () => {
    renderProfile()
    await screen.findByDisplayValue('Jim')
    const btn = screen.getByRole('button', { name: /save/i })
    expect(btn).toBeDisabled()
  })

  it('Save button enables when value is changed', async () => {
    renderProfile()
    const input = await screen.findByDisplayValue('Jim')
    fireEvent.change(input, { target: { value: 'Jimmy' } })
    const btn = screen.getByRole('button', { name: /save/i })
    expect(btn).not.toBeDisabled()
  })

  it('calls update_own_profile RPC on save', async () => {
    const { supabase } = await import('@/integrations/supabase/client')
    renderProfile()
    const input = await screen.findByDisplayValue('Jim')
    fireEvent.change(input, { target: { value: 'Jimmy' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('update_own_profile', {
        p_display_name: 'Jimmy',
      })
    })
  })

  it('shows success toast after save', async () => {
    const { toast } = await import('sonner')
    renderProfile()
    const input = await screen.findByDisplayValue('Jim')
    fireEvent.change(input, { target: { value: 'Jimmy' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Profile saved')
    })
  })

  it('shows error toast when RPC fails', async () => {
    const { supabase } = await import('@/integrations/supabase/client')
    const { toast } = await import('sonner')
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ error: { message: 'fail' } } as any)
    renderProfile()
    const input = await screen.findByDisplayValue('Jim')
    fireEvent.change(input, { target: { value: 'Jimmy' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save profile — please try again')
    })
  })

  it('Save button is disabled while mutation is in flight', async () => {
    const { supabase } = await import('@/integrations/supabase/client')
    vi.mocked(supabase.rpc).mockReturnValueOnce(new Promise(() => {}) as any)
    renderProfile()
    const input = await screen.findByDisplayValue('Jim')
    fireEvent.change(input, { target: { value: 'Jimmy' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /saving/i })
      expect(btn).toBeDisabled()
    })
  })
})
