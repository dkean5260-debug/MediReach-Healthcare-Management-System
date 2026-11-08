import React, { createContext, useContext, useState, useEffect } from 'react';
import { Medicine } from '../types/index.ts';

export interface CartItem {
  medicine: Medicine;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (medicine: Medicine, quantity?: number) => { success: boolean; message?: string };
  updateQuantity: (medicineId: string, quantity: number) => void;
  removeFromCart: (medicineId: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  hasColdChain: boolean;
  requiresPrescriptionCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('medireach_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('medireach_cart', JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  const addToCart = (medicine: Medicine, quantity = 1) => {
    if (medicine.stock <= 0) {
      return { success: false, message: `${medicine.name} is currently out of stock.` };
    }

    let result = { success: true, message: `Added ${medicine.name} to cart` };
    setItems((prev) => {
      const existing = prev.find((item) => item.medicine.id === medicine.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > medicine.stock) {
          result = { success: false, message: `Cannot add more than available stock (${medicine.stock} units).` };
          return prev;
        }
        return prev.map((item) =>
          item.medicine.id === medicine.id ? { ...item, quantity: newQty } : item
        );
      } else {
        if (quantity > medicine.stock) {
          result = { success: false, message: `Only ${medicine.stock} units available in cold storage.` };
          return prev;
        }
        return [...prev, { medicine, quantity }];
      }
    });
    return result;
  };

  const updateQuantity = (medicineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.medicine.id === medicineId) {
          const clamped = Math.min(quantity, item.medicine.stock);
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const removeFromCart = (medicineId: string) => {
    setItems((prev) => prev.filter((item) => item.medicine.id !== medicineId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.medicine.price * item.quantity, 0);
  const hasColdChain = items.some((item) => item.medicine.coldChain);
  const requiresPrescriptionCount = items.filter((item) => item.medicine.requiresPrescription).length;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        itemCount,
        subtotal,
        hasColdChain,
        requiresPrescriptionCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
