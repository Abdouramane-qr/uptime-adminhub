import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from './Login';

const {
  signInMock,
  navigateMock,
  toastErrorMock,
  toastSuccessMock,
  signUpMock,
  resetPasswordForEmailMock,
  signInWithOAuthMock,
} = vi.hoisted(() => {
  const signInMock = vi.fn();
  const navigateMock = vi.fn();
  const toastErrorMock = vi.fn();
  const toastSuccessMock = vi.fn();
  const signUpMock = vi.fn();
  const resetPasswordForEmailMock = vi.fn();
  const signInWithOAuthMock = vi.fn();

  return {
    signInMock,
    navigateMock,
    toastErrorMock,
    toastSuccessMock,
    signUpMock,
    resetPasswordForEmailMock,
    signInWithOAuthMock,
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: signInMock,
  }),
}));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

vi.mock('@/integrations/lovable/index', () => ({
  lovable: {
    auth: {
      signInWithOAuth: signInWithOAuthMock,
    },
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: signUpMock,
      resetPasswordForEmail: resetPasswordForEmailMock,
    },
  },
}));

describe('Login page', () => {
  beforeEach(() => {
    signInMock.mockReset();
    navigateMock.mockReset();
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
    signUpMock.mockReset();
    resetPasswordForEmailMock.mockReset();
    signInWithOAuthMock.mockReset();
  });

  it('submits login and navigates to dashboard on success', async () => {
    signInMock.mockResolvedValue(undefined);

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('admin@fleetrescue.com'), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'secret123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'auth.login' }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('admin@test.com', 'secret123');
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows toast error when login fails', async () => {
    signInMock.mockRejectedValue(new Error('invalid credentials'));

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('admin@fleetrescue.com'), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrong' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'auth.login' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('invalid credentials');
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });

  it('keeps login button disabled state while request is pending', async () => {
    signInMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 20)),
    );

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('admin@fleetrescue.com'), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'secret123' },
    });

    const submit = screen.getByRole('button', { name: 'auth.login' });
    fireEvent.click(submit);

    expect(submit).toBeDisabled();

    await waitFor(() => {
      expect(submit).not.toBeDisabled();
    });
  });

  it('submits signup and returns to login on success', async () => {
    signUpMock.mockResolvedValue({ error: null });

    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: 'auth.signup' }));
    fireEvent.change(screen.getByPlaceholderText('Jean Dupont'), {
      target: { value: 'Jane Admin' },
    });
    fireEvent.change(screen.getByPlaceholderText('admin@fleetrescue.com'), {
      target: { value: 'jane@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'signup123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'auth.signup' }));

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalled();
      expect(toastSuccessMock).toHaveBeenCalledWith('auth.verify_email');
    });

    expect(screen.getByRole('button', { name: 'auth.login' })).toBeInTheDocument();
  });

  it('submits forgot password and returns to login on success', async () => {
    resetPasswordForEmailMock.mockResolvedValue({ error: null });

    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: 'auth.forgot_password' }));
    fireEvent.change(screen.getByPlaceholderText('admin@fleetrescue.com'), {
      target: { value: 'recover@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'auth.send_link' }));

    await waitFor(() => {
      expect(resetPasswordForEmailMock).toHaveBeenCalled();
      expect(toastSuccessMock).toHaveBeenCalledWith('auth.reset_sent');
    });

    expect(screen.getByRole('button', { name: 'auth.login' })).toBeInTheDocument();
  });

  it('shows toast error for google oauth failure and fallback branch', async () => {
    signInWithOAuthMock.mockResolvedValueOnce({ error: new Error('oauth failed') });
    signInWithOAuthMock.mockResolvedValueOnce({ error: null });

    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: 'auth.google' }));
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('oauth failed');
    });

    fireEvent.click(screen.getByRole('button', { name: 'auth.google' }));
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('auth.google error');
    });
  });
});
