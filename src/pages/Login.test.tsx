import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from './Login';

const {
  signInMock,
  navigateMock,
  toastErrorMock,
  toastSuccessMock,
  resetPasswordForEmailMock,
} = vi.hoisted(() => {
  const signInMock = vi.fn();
  const navigateMock = vi.fn();
  const toastErrorMock = vi.fn();
  const toastSuccessMock = vi.fn();
  const resetPasswordForEmailMock = vi.fn();

  return {
    signInMock,
    navigateMock,
    toastErrorMock,
    toastSuccessMock,
    resetPasswordForEmailMock,
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

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
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
    resetPasswordForEmailMock.mockReset();
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

  it('does not expose public signup or google oauth', () => {
    render(<Login />);

    expect(screen.queryByRole('button', { name: 'auth.signup' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'auth.google' })).not.toBeInTheDocument();
    expect(
      screen.getByText('Les comptes sont provisionnes par l administration. Aucun signup public n est autorise sur ce portail.'),
    ).toBeInTheDocument();
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
});
