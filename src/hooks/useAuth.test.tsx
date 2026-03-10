import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './useAuth';

const jwt = (value: string) => `header.${value}.signature`;

const {
  getSessionMock,
  getUserMock,
  onAuthStateChangeMock,
  signInWithPasswordMock,
  signOutMock,
  fromMaybeSingleMock,
  fromEqMock,
  fromSelectMock,
  rpcMock,
  fetchMock,
  authStateHandlerRef,
} = vi.hoisted(() => {
  const getSessionMock = vi.fn();
  const getUserMock = vi.fn();
  const onAuthStateChangeMock = vi.fn();
  const signInWithPasswordMock = vi.fn();
  const signOutMock = vi.fn();

  const fromMaybeSingleMock = vi.fn();
  const fromEqMock = vi.fn(() => ({ maybeSingle: fromMaybeSingleMock }));
  const fromSelectMock = vi.fn(() => ({ eq: fromEqMock }));
  const rpcMock = vi.fn();

  const fetchMock = vi.fn();
  const authStateHandlerRef: { current: ((event: string, session: any) => void | Promise<void>) | null } = { current: null };

  return {
    getSessionMock,
    getUserMock,
    onAuthStateChangeMock,
    signInWithPasswordMock,
    signOutMock,
    fromMaybeSingleMock,
    fromEqMock,
    fromSelectMock,
    rpcMock,
    fetchMock,
    authStateHandlerRef,
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      getUser: getUserMock,
      onAuthStateChange: onAuthStateChangeMock,
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
    },
    rpc: rpcMock,
    from: vi.fn(() => ({
      select: fromSelectMock,
    })),
  },
}));

function AuthProbe() {
  const { user, loading, isAdmin, adminLoading } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="admin-loading">{String(adminLoading)}</div>
      <div data-testid="user">{user?.id || 'none'}</div>
      <div data-testid="is-admin">{String(isAdmin)}</div>
    </div>
  );
}

describe('useAuth integration', () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    getUserMock.mockReset();
    onAuthStateChangeMock.mockReset();
    signInWithPasswordMock.mockReset();
    signOutMock.mockReset();
    fromMaybeSingleMock.mockReset();
    fromEqMock.mockClear();
    fromSelectMock.mockClear();
    rpcMock.mockReset();
    fetchMock.mockReset();
    authStateHandlerRef.current = null;
    getUserMock.mockImplementation(async (token?: string) => {
      if (token === jwt('token-403')) {
        return { data: { user: { id: 'user-2' } }, error: null };
      }
      if (token === jwt('token-err')) {
        return { data: { user: { id: 'user-3' } }, error: null };
      }
      if (token === jwt('token-init')) {
        return { data: { user: { id: 'user-init' } }, error: null };
      }
      return { data: { user: { id: 'user-1' } }, error: null };
    });

    vi.stubGlobal('fetch', fetchMock);

    onAuthStateChangeMock.mockImplementation((cb: (event: string, session: any) => void | Promise<void>) => {
      authStateHandlerRef.current = cb;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    });

    fromMaybeSingleMock.mockResolvedValue({
      data: {
        id: 'profile-1',
        full_name: 'Admin User',
        avatar_url: null,
        role: 'admin',
      },
    });
    rpcMock.mockResolvedValue({ data: false });
  });

  it('marks authenticated admin when rpc is_admin returns true', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          access_token: jwt('token-rpc-admin'),
          user: { id: 'user-1' },
        },
      },
    });

    rpcMock.mockResolvedValue({ data: true });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('admin-loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('user-1');
      expect(screen.getByTestId('is-admin').textContent).toBe('true');
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('marks authenticated admin when rpc is false but admin-portal dashboard returns 200', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          access_token: jwt('token-200'),
          user: { id: 'user-1' },
        },
      },
    });

    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('admin-loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('user-1');
      expect(screen.getByTestId('is-admin').textContent).toBe('true');
    });
  });

  it('marks non-admin when admin-portal dashboard returns 403', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          access_token: jwt('token-403'),
          user: { id: 'user-2' },
        },
      },
    });

    fetchMock.mockResolvedValue({ ok: false, status: 403 });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('admin-loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('user-2');
      expect(screen.getByTestId('is-admin').textContent).toBe('false');
    });
  });

  it('keeps non-admin when dashboard gate fetch throws', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          access_token: jwt('token-err'),
          user: { id: 'user-3' },
        },
      },
    });

    fetchMock.mockRejectedValue(new Error('network down'));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('admin-loading').textContent).toBe('false');
      expect(screen.getByTestId('is-admin').textContent).toBe('false');
    });
  });

  it('handles bootstrap with no session', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: null,
      },
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('admin-loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('none');
      expect(screen.getByTestId('is-admin').textContent).toBe('false');
    });
  });

  it('handles auth state change to signed out session', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          access_token: jwt('token-init'),
          user: { id: 'user-init' },
        },
      },
    });
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-admin').textContent).toBe('true');
    });

    await act(async () => {
      await authStateHandlerRef.current?.('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('none');
      expect(screen.getByTestId('is-admin').textContent).toBe('false');
      expect(screen.getByTestId('admin-loading').textContent).toBe('false');
    });
  });
});
