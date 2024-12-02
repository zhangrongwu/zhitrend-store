import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: any | null;
  setAuth: (token: string, user: any) => void;
  clearAuth: () => void;
}

interface CartState {
  items: any[];
  count: number;
  addItem: (item: any) => void;
  removeItem: (id: number) => void;
  updateItem: (id: number, quantity: number) => void;
  clearCart: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      count: 0,
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
          count: state.count + 1,
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          count: state.count - 1,
        })),
      updateItem: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        })),
      clearCart: () => set({ items: [], count: 0 }),
    }),
    {
      name: 'cart-storage',
    }
  )
); 