import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useRealtimeProviderPresence, useRealtimeServiceRequests } from './useRealtime';

const {
  setQueriesData,
  invalidateQueries,
  onMock,
  subscribeMock,
  channelMock,
  removeChannelMock,
} = vi.hoisted(() => {
  const setQueriesData = vi.fn();
  const invalidateQueries = vi.fn();
  const onMock = vi.fn();
  const subscribeMock = vi.fn(() => ({ __channel: true }));
  const channelMock = vi.fn(() => ({
    on: onMock,
    subscribe: subscribeMock,
  }));
  const removeChannelMock = vi.fn();
  return {
    setQueriesData,
    invalidateQueries,
    onMock,
    subscribeMock,
    channelMock,
    removeChannelMock,
  };
});

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      setQueriesData,
      invalidateQueries,
    }),
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: channelMock,
    removeChannel: removeChannelMock,
  },
}));

function ServiceRequestsHookHost() {
  useRealtimeServiceRequests();
  return null;
}

function ServiceRequestsDisabledHost() {
  useRealtimeServiceRequests({ enabled: false });
  return null;
}

function ServiceRequestsCustomKeysHost() {
  useRealtimeServiceRequests({ queryKeys: [['custom-requests']] });
  return null;
}

function ProviderPresenceHookHost() {
  useRealtimeProviderPresence();
  return null;
}

describe('useRealtime hooks', () => {
  beforeEach(() => {
    setQueriesData.mockReset();
    invalidateQueries.mockReset();
    onMock.mockReset();
    subscribeMock.mockClear();
    channelMock.mockClear();
    removeChannelMock.mockClear();

    onMock.mockImplementation((_event: string, _filter: unknown, cb: (payload: any) => void) => {
      cb({
        eventType: 'INSERT',
        new: { id: 'r1', status: 'pending' },
        old: {},
      });
      return {
        subscribe: subscribeMock,
      };
    });
  });

  it('subscribes and syncs service_requests cache keys', () => {
    const { unmount } = render(<ServiceRequestsHookHost />);

    expect(channelMock).toHaveBeenCalledTimes(1);
    expect(setQueriesData).toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['service-requests'], refetchType: 'active' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'], refetchType: 'active' });

    unmount();
    expect(removeChannelMock).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe when disabled', () => {
    const { unmount } = render(<ServiceRequestsDisabledHost />);

    expect(channelMock).not.toHaveBeenCalled();

    unmount();
    expect(removeChannelMock).not.toHaveBeenCalled();
  });

  it('uses custom query keys when provided', () => {
    const { unmount } = render(<ServiceRequestsCustomKeysHost />);

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['custom-requests'], refetchType: 'active' });

    unmount();
    expect(removeChannelMock).toHaveBeenCalledTimes(1);
  });

  it('subscribes and syncs provider_presence cache keys', () => {
    const { unmount } = render(<ProviderPresenceHookHost />);

    expect(channelMock).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['provider-presence'], refetchType: 'active' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'], refetchType: 'active' });

    unmount();
    expect(removeChannelMock).toHaveBeenCalledTimes(1);
  });

  it('patches cache on UPDATE events', () => {
    onMock.mockImplementationOnce((_event: string, _filter: unknown, cb: (payload: any) => void) => {
      cb({
        eventType: 'UPDATE',
        new: { id: 'r1', status: 'completed' },
        old: { id: 'r1', status: 'pending' },
      });
      return { subscribe: subscribeMock };
    });

    render(<ServiceRequestsHookHost />);

    expect(setQueriesData).toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['service-requests'], refetchType: 'active' });
  });

  it('patches cache on DELETE events', () => {
    onMock.mockImplementationOnce((_event: string, _filter: unknown, cb: (payload: any) => void) => {
      cb({
        eventType: 'DELETE',
        new: {},
        old: { id: 'r2' },
      });
      return { subscribe: subscribeMock };
    });

    render(<ProviderPresenceHookHost />);

    expect(setQueriesData).toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['provider-presence'], refetchType: 'active' });
  });

  it('applies updater logic for array/items/item cache structures', () => {
    const payload = {
      eventType: 'UPDATE',
      new: { id: 'r5', status: 'done' },
      old: { id: 'r5', status: 'pending' },
    };

    onMock.mockImplementationOnce((_event: string, _filter: unknown, cb: (data: any) => void) => {
      cb(payload);
      return { subscribe: subscribeMock };
    });

    render(<ServiceRequestsHookHost />);

    const firstUpdater = setQueriesData.mock.calls[0][1] as (current: unknown) => unknown;
    const secondUpdater = setQueriesData.mock.calls[1][1] as (current: unknown) => unknown;

    const arrayOut = firstUpdater([{ id: 'r5', status: 'pending' }, { id: 'x1', status: 'assigned' }]) as Array<{ id: string; status: string }>;
    expect(arrayOut.find((r) => r.id === 'r5')?.status).toBe('done');

    const itemsOut = firstUpdater({ items: [{ id: 'r5', status: 'pending' }] }) as { items: Array<{ id: string; status: string }> };
    expect(itemsOut.items[0].status).toBe('done');

    const itemOut = secondUpdater({ item: { id: 'r5', status: 'pending' } }) as { item: { id: string; status: string } };
    expect(itemOut.item.status).toBe('done');
  });

  it('keeps cache unchanged when payload has no identifiable id', () => {
    onMock.mockImplementationOnce((_event: string, _filter: unknown, cb: (data: any) => void) => {
      cb({
        eventType: 'INSERT',
        new: { status: 'pending' },
        old: {},
      });
      return { subscribe: subscribeMock };
    });

    render(<ProviderPresenceHookHost />);

    const updater = setQueriesData.mock.calls[0][1] as (current: unknown) => unknown;
    const input = [{ id: 'ok-1', status: 'active' }];
    const out = updater(input);
    expect(out).toEqual(input);
  });
});
