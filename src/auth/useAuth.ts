import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Value exposed by the authentication context.
 * Guests are represented by `session === null` and `user === null`.
 */
export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Access the current authentication state.
 * Must be used within `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}