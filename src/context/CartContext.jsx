import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { addToast } = useToast();
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('localloop_cart_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved cart', e);
      }
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('localloop_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, requestedQty = 1) => {
    if (!product || product.stockQuantity <= 0) {
      addToast('Sorry, this product is currently out of stock.', 'error');
      return false;
    }

    let addedQty = requestedQty;
    let didCap = false;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product.id === product.id);

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const total = currentQty + requestedQty;

        if (total > product.stockQuantity) {
          didCap = true;
          addedQty = product.stockQuantity - currentQty;
          const updated = [...prevItems];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: product.stockQuantity,
          };
          return updated;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: total,
        };
        return updated;
      } else {
        if (requestedQty > product.stockQuantity) {
          didCap = true;
          return [...prevItems, { product, quantity: product.stockQuantity }];
        }
        return [...prevItems, { product, quantity: requestedQty }];
      }
    });

    if (didCap) {
      addToast(`Added max available stock (${product.stockQuantity}) for ${product.title}`, 'info');
    } else {
      addToast(`Added ${product.title} to your cart`, 'success');
    }
    setIsCartOpen(true);
    return true;
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.stockQuantity;
          if (newQty > maxStock) {
            addToast(`Only ${maxStock} units available in stock.`, 'info');
            return { ...item, quantity: maxStock };
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    addToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = Number(
    cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)
  );
  const freeDeliveryThreshold = 35;
  const qualifiesForFreeDelivery = subtotal >= freeDeliveryThreshold;
  const deliveryFee = subtotal === 0 ? 0 : qualifiesForFreeDelivery ? 0 : 3.50;
  const estimatedTax = Number((subtotal * 0.08).toFixed(2));
  const estimatedTotal = Number((subtotal + deliveryFee + estimatedTax).toFixed(2));

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isCartOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    toggleCart: () => setIsCartOpen((prev) => !prev),
    totalItems,
    subtotal,
    deliveryFee,
    estimatedTax,
    estimatedTotal,
    freeDeliveryThreshold,
    qualifiesForFreeDelivery,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
