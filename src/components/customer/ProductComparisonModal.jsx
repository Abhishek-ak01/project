import React from 'react';
import { X, Scale, ShoppingBag, Trash2, Check, AlertCircle, MapPin } from 'lucide-react';
import { useComparison } from '../../context/ComparisonContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';

export default function ProductComparisonModal() {
  const { comparedProducts, removeFromComparison, clearComparison, isModalOpen, closeModal } = useComparison();
  const { addToCart } = useCart();

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-cream-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-cream-300 flex items-center justify-between bg-cream-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest-900 text-emerald-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-forest-950 text-base">Local Product Comparison</h3>
              <p className="text-xs text-charcoal-500">Compare pricing, ingredients, and seller proximity</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {comparedProducts.length > 0 && (
              <button
                onClick={clearComparison}
                className="text-xs text-charcoal-500 hover:text-rose-600 px-2 py-1 rounded transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={closeModal}
              className="p-1.5 rounded-full text-charcoal-400 hover:text-charcoal-700 hover:bg-cream-200 transition-colors"
              aria-label="Close comparison modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {comparedProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-cream-200 text-charcoal-400 flex items-center justify-center mx-auto mb-3">
                <Scale className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-charcoal-800">No products selected yet</h4>
              <p className="text-xs text-charcoal-500 max-w-sm mx-auto mt-1">
                Browse the marketplace and click the balance scale icon on any product cards to compare them side-by-side.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-cream-300">
              {comparedProducts.map((product) => (
                <div key={product.id} className="pt-4 md:pt-0 md:px-3 flex flex-col justify-between first:pl-0 last:pr-0">
                  <div className="space-y-4">
                    {/* Top image & remove */}
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-cream-100 border border-cream-200">
                      <img
                        src={product.images?.[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeFromComparison(product.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-charcoal-600 hover:text-rose-600 hover:bg-white shadow-sm transition-all"
                        title="Remove from comparison"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Title & Seller */}
                    <div>
                      <span className="text-[11px] font-semibold text-forest-700 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-forest-600" />
                        <span>{product.sellerName}</span>
                      </span>
                      <h4 className="font-bold text-charcoal-900 text-sm mt-0.5 leading-snug">
                        {product.title}
                      </h4>
                      <p className="text-[11px] text-charcoal-500 mt-0.5">
                        {product.originNeighborhood}
                      </p>
                    </div>

                    {/* Comparison Metrics */}
                    <div className="space-y-2.5 text-xs border-t border-cream-200 pt-3">
                      <div className="flex justify-between py-1 border-b border-cream-100">
                        <span className="text-charcoal-500">Price / Unit:</span>
                        <span className="font-bold text-forest-900">
                          {formatCurrency(product.price)} <span className="text-[10px] font-normal text-charcoal-500">/{product.unit}</span>
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-cream-100">
                        <span className="text-charcoal-500">Rating:</span>
                        <span className="font-semibold text-amber-700">★ {product.rating} ({product.reviewCount})</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-cream-100">
                        <span className="text-charcoal-500">Organic Cert:</span>
                        <span className="font-semibold">
                          {product.isOrganic ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">100% Organic</span>
                          ) : (
                            <span className="text-charcoal-400 text-[11px]">Conventional</span>
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-cream-100">
                        <span className="text-charcoal-500">Shelf Life:</span>
                        <span className="font-medium text-charcoal-800 text-right text-[11px]">{product.shelfLife || 'Fresh Daily'}</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-cream-100">
                        <span className="text-charcoal-500">Availability:</span>
                        <span className={`font-semibold text-[11px] ${product.stockQuantity > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                        </span>
                      </div>

                      {product.dietary && product.dietary.length > 0 && (
                        <div className="pt-1">
                          <span className="text-charcoal-500 block text-[10px] uppercase font-semibold mb-1">Dietary Highlights:</span>
                          <div className="flex flex-wrap gap-1">
                            {product.dietary.map((d, i) => (
                              <span key={i} className="bg-cream-100 text-charcoal-700 text-[10px] px-1.5 py-0.5 rounded border border-cream-300">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add to cart CTA */}
                  <div className="pt-4 mt-4 border-t border-cream-200">
                    <button
                      onClick={() => {
                        addToCart(product, 1);
                        closeModal();
                      }}
                      disabled={product.stockQuantity <= 0}
                      className="w-full bg-forest-900 hover:bg-forest-800 disabled:bg-cream-300 disabled:text-charcoal-400 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{product.stockQuantity <= 0 ? 'Sold Out' : 'Add to Cart'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
