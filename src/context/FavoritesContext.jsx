import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { addToast } = useToast();
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('localloop_favorites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }
    return ['prod-1', 'prod-4', 'prod-8']; // Seed a couple initial favorites
  });

  useEffect(() => {
    localStorage.setItem('localloop_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (product) => {
    if (!product) return;
    const isFav = favorites.includes(product.id);

    if (isFav) {
      setFavorites((prev) => prev.filter((id) => id !== product.id));
      addToast(`Removed ${product.title} from saved items`, 'info');
    } else {
      setFavorites((prev) => [...prev, product.id]);
      addToast(`Saved ${product.title} to your favorites ❤️`, 'success');
    }
  };

  const isFavorite = (productId) => favorites.includes(productId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
