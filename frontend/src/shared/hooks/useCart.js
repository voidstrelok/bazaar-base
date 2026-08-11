import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (producto) => {
        set((state) => {
          const existing = state.items.find((i) => i.productoId === producto.id);
          if (existing) {
            // No incrementar más allá del stock disponible
            if (existing.cantidad >= producto.stock) return state;
            return {
              items: state.items.map((i) =>
                i.productoId === producto.id
                  ? { ...i, cantidad: i.cantidad + 1 }
                  : i
              ),
            };
          }
          if (producto.stock <= 0) return state;
          return {
            items: [
              ...state.items,
              {
                productoId: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                imagenUrl: producto.imagenUrl,
                stock: producto.stock,
                cantidad: 1,
              },
            ],
          };
        });
      },

      removeItem: (productoId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productoId !== productoId),
        })),

      updateQuantity: (productoId, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(productoId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (i.productoId !== productoId) return i;
            // Capear al stock disponible guardado en el ítem
            const cantidadFinal = i.stock != null ? Math.min(cantidad, i.stock) : cantidad;
            return { ...i, cantidad: cantidadFinal };
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((acc, i) => acc + i.precio * i.cantidad, 0),

      itemCount: () =>
        get().items.reduce((acc, i) => acc + i.cantidad, 0),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'bazaar-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useCart;
