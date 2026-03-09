import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import AdminGuard from './AdminGuard';

const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const renderWithRouter = (ui: ReactNode) =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {ui}
    </MemoryRouter>,
  );

describe('AdminGuard', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('shows spinner while loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, adminLoading: true, isAdmin: false });

    const { container } = renderWithRouter(
      <AdminGuard>
        <div>Admin Content</div>
      </AdminGuard>,
    );

    expect(container.querySelector('svg.animate-spin')).toBeTruthy();
  });

  it('redirects to login when no user', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, adminLoading: false, isAdmin: false });

    renderWithRouter(
      <AdminGuard>
        <div>Admin Content</div>
      </AdminGuard>,
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('shows access required panel when user is not admin', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false, adminLoading: false, isAdmin: false });

    renderWithRouter(
      <AdminGuard>
        <div>Admin Content</div>
      </AdminGuard>,
    );

    expect(screen.getByText('Admin access required')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders children when user is admin', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false, adminLoading: false, isAdmin: true });

    renderWithRouter(
      <AdminGuard>
        <div>Admin Content</div>
      </AdminGuard>,
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
