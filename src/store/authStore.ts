
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { base44 } from '@/lib/api'

interface User {
  id: string;
  username: string;
  name: string;
  // Add other user properties here
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  shopId: string | null; // Added to match initial state
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      shopId: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      checkAuth: async () => {
          // This can be expanded to verify token validity with backend
          try {
              // const user = await base44.auth.me();
              // set({ user });
          } catch (e) {
              set({ token: null, user: null, isAuthenticated: false })
          }
      }
    }),
    {
      name: 'shop-owner-auth', // name of the item in the storage (must be unique)
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }), // Persist these fields
    }
  )
)
