import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoleGuard from './RoleGuard';

const mockUseRole = vi.fn();

vi.mock('@/hooks/useRole', () => ({
  useRole: () => mockUseRole(),
}));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

describe('RoleGuard', () => {
  beforeEach(() => {
    mockUseRole.mockReset();
  });

  it('shows spinner while roles are loading', () => {
    mockUseRole.mockReturnValue({ loading: true, hasAnyRole: () => false, roles: [] });

    const { container } = render(
      <RoleGuard allowedRoles={['admin']}>
        <div>Secured</div>
      </RoleGuard>,
    );

    expect(container.querySelector('svg.animate-spin')).toBeTruthy();
  });

  it('shows access denied when role is not allowed', () => {
    mockUseRole.mockReturnValue({
      loading: false,
      roles: ['user'],
      hasAnyRole: () => false,
    });

    render(
      <RoleGuard allowedRoles={['admin']}>
        <div>Secured</div>
      </RoleGuard>,
    );

    expect(screen.getByText('guard.restricted')).toBeInTheDocument();
    expect(screen.queryByText('Secured')).not.toBeInTheDocument();
  });

  it('renders children when role is allowed', () => {
    mockUseRole.mockReturnValue({
      loading: false,
      roles: ['admin'],
      hasAnyRole: () => true,
    });

    render(
      <RoleGuard allowedRoles={['admin']}>
        <div>Secured</div>
      </RoleGuard>,
    );

    expect(screen.getByText('Secured')).toBeInTheDocument();
  });
});
