import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from './useAuth';

const {
  getSessionMock,
  getUserMock,
  onAuthStateChangeMock,
  signInWithPasswordMock,
  signOutMock,
  fetchMock,
  rpcMock,
} = vi.hoisted(() => {
  const getSessionMock = vi.fn();
  const getUserMock = vi.fn();
  const onAuthStateChangeMock = vi.fn();
  const signInWithPasswordMock = vi.fn();
  const signOutMock = vi.fn();
  const fetchMock = vi.fn();
  const rpcMock = vi.fn();

  return {
    getSessionMock,
    getUserMock,
    onAuthStateChangeMock,
    signInWithPasswordMock,
    signOutMock,
    fetchMock,
    rpcMock,
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
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  },
}));

function AuthActionsProbe() {
  const { loading, signIn, signOut } = useAuth();

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <button onClick={() => signIn('admin@test.com', 'secret')}>do-signin</button>
      <button onClick={() => signOut()}>do-signout</button>
    </div>
  );
}

describe('useAuth actions', () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    getUserMock.mockReset();
    onAuthStateChangeMock.mockReset();
    signInWithPasswordMock.mockReset();
    signOutMock.mockReset();
    fetchMock.mockReset();
    rpcMock.mockReset();
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

    vi.stubGlobal('fetch', fetchMock);

    onAuthStateChangeMock.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });

    getSessionMock.mockResolvedValue({
      data: {
        session: null,
      },
    });
    rpcMock.mockResolvedValue({ data: false });
  });

  it('delegates signIn to Supabase auth client', async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: {
        session: {
          access_token: 'header.payload.signature',
          user: { id: 'user-1' },
        },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <AuthActionsProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    fireEvent.click(screen.getByText('do-signin'));

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: 'admin@test.com',
        password: 'secret',
      });
    });
  });

  it('delegates signOut to Supabase auth client', async () => {
    signOutMock.mockResolvedValue({ error: null });

    render(
      <AuthProvider>
        <AuthActionsProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    fireEvent.click(screen.getByText('do-signout'));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1);
    });
  });
});
