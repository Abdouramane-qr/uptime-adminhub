import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import AdminGuard from './AdminGuard';

const mockUseAuth = vi.fn();
const mockUseRole = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));
vi.mock('@/hooks/useRole', () => ({
  useRole: () => mockUseRole(),
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
    mockUseRole.mockReset();
  });

  it('shows spinner while loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    mockUseRole.mockReturnValue({ roles: [], loading: true });

    const { container } = renderWithRouter(
      <AdminGuard>
        <div>Admin Content</div>
      </AdminGuard>,
    );

    expect(container.querySelector('svg.animate-spin')).toBeTruthy();
  });

  it('redirects to login when no user', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    mockUseRole.mockReturnValue({ roles: [], loading: false });

    renderWithRouter(
      <AdminGuard>
        <div>Admin Content</div>
      </AdminGuard>,
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('redirects to pending-access when user has no assigned role', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false });
    mockUseRole.mockReturnValue({ roles: [], loading: false });

    renderWithRouter(
      <AdminGuard>
        <div>Admin Content</div>
      </AdminGuard>,
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders children when user has at least one role', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false });
    mockUseRole.mockReturnValue({ roles: ['moderator'], loading: false });

    renderWithRouter(
      <AdminGuard>
        <div>Admin Content</div>
      </AdminGuard>,
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
