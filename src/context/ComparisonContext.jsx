import React, { createContext, useContext, useState } from 'react';
import { useToast } from './ToastContext';

const ComparisonContext = createContext(null);

export function ComparisonProvider({ children }) {
  const { addToast } = useToast();
  const [comparedProducts, setComparedProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const addToComparison = (product) => {
    if (comparedProducts.some((p) => p.id === product.id)) {
      addToast(`${product.title} is already in the comparison drawer.`, 'info');
      setIsModalOpen(true);
      return;
    }

    if (comparedProducts.length >= 3) {
      addToast('You can compare a maximum of 3 products at a time.', 'warning');
      setIsModalOpen(true);
      return;
    }

    setComparedProducts((prev) => [...prev, product]);
    addToast(`Added ${product.title} to comparison`, 'success');
    setIsModalOpen(true);
  };

  const removeFromComparison = (productId) => {
    setComparedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const isInComparison = (productId) => {
    return comparedProducts.some((p) => p.id === productId);
  };

  const clearComparison = () => {
    setComparedProducts([]);
  };

  const value = {
    comparedProducts,
    addToComparison,
    removeFromComparison,
    isInComparison,
    clearComparison,
    isModalOpen,
    openModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
  };

  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>;
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}
