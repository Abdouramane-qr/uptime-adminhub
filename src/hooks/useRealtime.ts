import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RealtimeHookOptions<T extends { id?: string | number } = { id?: string | number }> = {
  enabled?: boolean;
  queryKeys?: QueryKey[];
  schema?: string;
  onEvent?: (payload: RealtimePostgresChangesPayload<T>) => void;
};

function getRowId(row: unknown): string | number | null {
  if (!row || typeof row !== 'object') return null;
  const id = (row as { id?: string | number }).id;
  return typeof id === 'string' || typeof id === 'number' ? id : null;
}

function patchArrayByPayload<T>(arr: T[], payload: RealtimePostgresChangesPayload<any>): T[] {
  const event = payload.eventType;
  const nextRow = payload.new as T | Record<string, unknown>;
  const oldRow = payload.old as T | Record<string, unknown>;

  const nextId = getRowId(nextRow);
  const oldId = getRowId(oldRow);
  const rowId = nextId ?? oldId;

  if (rowId == null) return arr;

  if (event === 'INSERT') {
    const has = arr.some((it) => getRowId(it) === rowId);
    if (has) return arr;
    return [nextRow as T, ...arr];
  }

  if (event === 'UPDATE') {
    return arr.map((it) => (getRowId(it) === rowId ? ({ ...(it as object), ...(nextRow as object) } as T) : it));
  }

  if (event === 'DELETE') {
    return arr.filter((it) => getRowId(it) !== rowId);
  }

  return arr;
}

function patchQueryDataByPayload<TData>(current: TData, payload: RealtimePostgresChangesPayload<any>): TData {
  if (!current) return current;

  if (Array.isArray(current)) {
    return patchArrayByPayload(current, payload) as TData;
  }

  if (typeof current === 'object' && current !== null) {
    const asRecord = current as Record<string, unknown>;

    if (Array.isArray(asRecord.items)) {
      return {
        ...asRecord,
        items: patchArrayByPayload(asRecord.items, payload),
      } as TData;
    }

    if (asRecord.item && typeof asRecord.item === 'object') {
      const itemId = getRowId(asRecord.item);
      const nextId = getRowId(payload.new);
      const oldId = getRowId(payload.old);
      const rowId = nextId ?? oldId;

      if (rowId != null && itemId === rowId && payload.eventType !== 'DELETE') {
        return {
          ...asRecord,
          item: { ...(asRecord.item as object), ...(payload.new as object) },
        } as TData;
      }
    }
  }

  return current;
}

function useRealtimeTable<T extends { id?: string | number }>(
  table: 'service_requests' | 'provider_presence',
  {
    enabled = true,
    queryKeys,
    schema = 'public',
    onEvent,
  }: RealtimeHookOptions<T> = {},
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const keys = queryKeys && queryKeys.length
      ? queryKeys
      : table === 'service_requests'
      ? [['service-requests'], ['dashboard']]
      : [['provider-presence'], ['dashboard']];

    const channel = supabase
      .channel(`${table}_realtime_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema, table },
        (payload) => {
          keys.forEach((queryKey) => {
            queryClient.setQueriesData({ queryKey }, (current) => patchQueryDataByPayload(current, payload));
            queryClient.invalidateQueries({ queryKey, refetchType: 'active' });
          });

          if (onEvent) onEvent(payload as RealtimePostgresChangesPayload<T>);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, onEvent, queryClient, queryKeys, schema, table]);
}

export function useRealtimeServiceRequests<T extends { id?: string | number } = { id?: string | number }>(
  options: RealtimeHookOptions<T> = {},
) {
  useRealtimeTable<T>('service_requests', options);
}

export function useRealtimeProviderPresence<T extends { id?: string | number } = { id?: string | number }>(
  options: RealtimeHookOptions<T> = {},
) {
  useRealtimeTable<T>('provider_presence', options);
}
