import { isSupabaseConfigured, supabase } from './supabase';
import { getActiveUserId, getUserStorageKey } from './storageIdentity';

export type FocusTimerStatus = 'idle' | 'running' | 'paused';

export type FocusTimerState = {
  status: FocusTimerStatus;
  subjectId: string | null;
  taskId: string | null;
  operationId: string | null;
  durationSeconds: number;
  remainingSeconds: number;
  endsAt: number | null;
  serverBacked: boolean;
};

const STORAGE_KEY = 'studyquest_focus_timer_v1';

const makeId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `focus-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
};

const clampMinutes = (minutes: number) =>
  Math.max(5, Math.min(120, Math.round(Number(minutes) || 25)));

const idleState = (): FocusTimerState => ({
  status: 'idle',
  subjectId: null,
  taskId: null,
  operationId: null,
  durationSeconds: 0,
  remainingSeconds: 0,
  endsAt: null,
  serverBacked: false,
});

const normalize = (value: Partial<FocusTimerState> | null | undefined): FocusTimerState => {
  const durationSeconds = Math.max(
    0,
    Math.min(7200, Math.round(Number(value?.durationSeconds) || 0)),
  );

  const remainingSeconds = Math.max(
    0,
    Math.min(
      durationSeconds || 7200,
      Math.round(Number(value?.remainingSeconds) || 0),
    ),
  );

  const status: FocusTimerStatus =
    value?.status === 'running' || value?.status === 'paused'
      ? value.status
      : 'idle';

  if (
    status === 'idle' ||
    !value?.subjectId ||
    !value?.operationId ||
    durationSeconds <= 0
  ) {
    return idleState();
  }

  return {
    status,
    subjectId: value.subjectId,
    taskId: value.taskId ?? null,
    operationId: value.operationId,
    durationSeconds,
    remainingSeconds,
    endsAt:
      status === 'running' &&
      typeof value.endsAt === 'number' &&
      Number.isFinite(value.endsAt)
        ? value.endsAt
        : null,
    serverBacked: Boolean(value.serverBacked),
  };
};

const read = (): FocusTimerState => {
  try {
    const raw = localStorage.getItem(
      getUserStorageKey(STORAGE_KEY, getActiveUserId()),
    );

    return normalize(
      raw ? (JSON.parse(raw) as Partial<FocusTimerState>) : null,
    );
  } catch {
    return idleState();
  }
};

const write = (state: FocusTimerState) => {
  try {
    localStorage.setItem(
      getUserStorageKey(STORAGE_KEY, getActiveUserId()),
      JSON.stringify(state),
    );
  } catch {
    // Best effort only.
  }
};

const remainingNow = (state: FocusTimerState) => {
  if (state.status !== 'running' || state.endsAt === null) {
    return Math.max(0, state.remainingSeconds);
  }

  return Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
};

const onlineServerSessionAllowed = () =>
  isSupabaseConfigured &&
  getActiveUserId() !== 'guest' &&
  typeof navigator !== 'undefined' &&
  navigator.onLine;

export const focusTimer = {
  load(): FocusTimerState {
    const state = read();

    return {
      ...state,
      remainingSeconds: remainingNow(state),
    };
  },

  start: async (
    subjectId: string,
    durationMinutes: number,
    taskId: string | null = null,
  ): Promise<FocusTimerState> => {
    const current = focusTimer.load();

    if (current.status !== 'idle') {
      throw new Error('focus_timer_session_exists');
    }

    const minutes = clampMinutes(durationMinutes);
    const operationId = makeId();
    let serverBacked = false;

    if (onlineServerSessionAllowed()) {
      const { error } = await supabase.rpc('focus_timer_start', {
        p_subject_id: subjectId,
        p_duration_minutes: minutes,
        p_operation_id: operationId,
        p_task_id: taskId,
      });

      if (error) throw error;

      serverBacked = true;
    }

    const now = Date.now();

    const state: FocusTimerState = {
      status: 'running',
      subjectId,
      taskId,
      operationId,
      durationSeconds: minutes * 60,
      remainingSeconds: minutes * 60,
      endsAt: now + minutes * 60 * 1000,
      serverBacked,
    };

    write(state);
    return state;
  },

  pause: async (): Promise<FocusTimerState> => {
    const current = focusTimer.load();

    if (current.status !== 'running') {
      return current;
    }

    if (
      current.serverBacked &&
      current.operationId &&
      onlineServerSessionAllowed()
    ) {
      const { error } = await supabase.rpc('focus_timer_pause', {
        p_operation_id: current.operationId,
      });

      if (error) throw error;
    }

    const paused: FocusTimerState = {
      ...current,
      status: 'paused',
      remainingSeconds: remainingNow(current),
      endsAt: null,
    };

    write(paused);
    return paused;
  },

  resume: async (): Promise<FocusTimerState> => {
    const current = focusTimer.load();

    if (current.status !== 'paused') {
      return current;
    }

    if (
      current.serverBacked &&
      current.operationId &&
      onlineServerSessionAllowed()
    ) {
      const { error } = await supabase.rpc('focus_timer_resume', {
        p_operation_id: current.operationId,
      });

      if (error) throw error;
    }

    const resumed: FocusTimerState = {
      ...current,
      status: 'running',
      endsAt: Date.now() + current.remainingSeconds * 1000,
    };

    write(resumed);
    return resumed;
  },

  cancel: async (): Promise<FocusTimerState> => {
    const current = focusTimer.load();

    if (
      current.status !== 'idle' &&
      current.serverBacked &&
      current.operationId &&
      onlineServerSessionAllowed()
    ) {
      try {
        await supabase.rpc('focus_timer_cancel', {
          p_operation_id: current.operationId,
        });
      } catch {
        // Local cancellation still removes the reward path.
      }
    }

    const next = idleState();
    write(next);
    return next;
  },

  complete: async (): Promise<{
    state: FocusTimerState;
    reward: {
      session_id: string;
      coins: number;
      gems: number;
      stars: number;
      total_xp: number;
      level: number;
      coins_awarded?: number;
      daily_coin_cap?: number;
    } | null;
  }> => {
    const current = focusTimer.load();

    if (current.status === 'idle') {
      return { state: current, reward: null };
    }

    if (current.remainingSeconds > 0) {
      throw new Error('focus_timer_not_elapsed');
    }

    let reward = null;

    if (
      current.serverBacked &&
      current.operationId &&
      !onlineServerSessionAllowed()
    ) {
      const pending: FocusTimerState = {
        ...current,
        status: 'paused',
        remainingSeconds: 0,
        endsAt: null,
      };
      write(pending);
      return { state: pending, reward: null };
    }

    if (
      current.serverBacked &&
      current.operationId &&
      onlineServerSessionAllowed()
    ) {
      let data: unknown;
      try {
        const response = await supabase.rpc('focus_timer_complete', {
          p_operation_id: current.operationId,
        });
        if (response.error) throw response.error;
        data = response.data;
      } catch (error) {
        const pending: FocusTimerState = {
          ...current,
          status: 'paused',
          remainingSeconds: 0,
          endsAt: null,
        };
        write(pending);
        throw error;
      }

      reward = data as {
        session_id: string;
        coins: number;
        gems: number;
        stars: number;
        total_xp: number;
        level: number;
        coins_awarded?: number;
        daily_coin_cap?: number;
      };
    }

    const next = idleState();
    write(next);

    return { state: next, reward };
  },
};
