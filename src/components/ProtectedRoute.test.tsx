import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import ProtectedRoute from './ProtectedRoute';

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

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('shows loading spinner while auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });

    const { container } = renderWithRouter(
      <ProtectedRoute>
        <div>Private Content</div>
      </ProtectedRoute>,
    );

    expect(container.querySelector('svg.animate-spin')).toBeTruthy();
  });

  it('redirects to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    renderWithRouter(
      <ProtectedRoute>
        <div>Private Content</div>
      </ProtectedRoute>,
    );

    expect(screen.queryByText('Private Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false });

    renderWithRouter(
      <ProtectedRoute>
        <div>Private Content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText('Private Content')).toBeInTheDocument();
  });
});
