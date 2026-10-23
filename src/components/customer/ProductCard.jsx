import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Heart, Scale, MapPin, AlertCircle, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useComparison } from '../../context/ComparisonContext';
import { useFavorites } from '../../context/FavoritesContext';
import { formatCurrency } from '../../utils/formatters';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { addToComparison, removeFromComparison, isInComparison } = useComparison();
  const { isFavorite, toggleFavorite } = useFavorites();

  const isLiked = isFavorite(product.id);
  const inCompare = isInComparison(product.id);
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  const handleCompareClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromComparison(product.id);
    } else {
      addToComparison(product);
    }
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-cream-300 overflow-hidden hover:border-forest-400 hover:shadow-elevated transition-all duration-300 flex flex-col h-full">
      {/* Image Container with Consistent Aspect Ratio */}
      <div className="relative aspect-[4/3] bg-cream-100 overflow-hidden">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';
            }}
          />
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {product.isOrganic && (
            <span className="bg-forest-900/90 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              Organic
            </span>
          )}
          {product.badges?.map((badge, idx) => (
            <span 
              key={idx} 
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${
                badge === 'Low Stock' || isLowStock
                  ? 'bg-amber-500/95 text-white' 
                  : 'bg-white/95 text-charcoal-800'
              }`}
            >
              {isLowStock && badge !== 'Low Stock' ? `Only ${product.stockQuantity} left` : badge}
            </span>
          ))}
          {isOutOfStock && (
            <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              Sold Out
            </span>
          )}
        </div>

        {/* Action icons on image top-right */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleFavoriteClick}
            aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-sm ${
              isLiked 
                ? 'bg-rose-50 text-rose-600' 
                : 'bg-white/80 hover:bg-white text-charcoal-600 hover:text-rose-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <button
            onClick={handleCompareClick}
            aria-label={inCompare ? 'Remove from comparison' : 'Compare product'}
            title="Compare with similar items"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-sm ${
              inCompare
                ? 'bg-forest-700 text-white'
                : 'bg-white/80 hover:bg-white text-charcoal-600 hover:text-forest-800'
            }`}
          >
            <Scale className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Seller & Origin Tag */}
          <div className="flex items-center justify-between text-[11px] text-charcoal-500 mb-1 gap-1">
            <Link 
              to={`/store/${product.sellerSlug || product.sellerId}`}
              className="hover:text-forest-700 font-semibold truncate hover:underline"
            >
              {product.sellerName || 'Local Maker'}
            </Link>
            {product.originNeighborhood && (
              <span className="shrink-0 flex items-center gap-0.5 text-forest-700/80">
                <MapPin className="w-2.5 h-2.5" />
                <span className="truncate max-w-[110px]">{product.originNeighborhood.replace(' District', '')}</span>
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link to={`/product/${product.id}`} className="block group-hover:text-forest-800 transition-colors">
            <h3 className="font-semibold text-charcoal-900 text-sm leading-snug line-clamp-2">
              {product.title}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-charcoal-800 ml-1">{product.rating || '4.9'}</span>
            </div>
            <span className="text-[11px] text-charcoal-400">({product.reviewCount || 18})</span>
          </div>
        </div>

        {/* Price & Add to Cart Footer */}
        <div className="pt-3 mt-2 border-t border-cream-200 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-forest-950">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-xs text-charcoal-400 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>
            <span className="text-[11px] text-charcoal-500 block -mt-0.5">
              /{product.unit}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
              isOutOfStock
                ? 'bg-cream-300 text-charcoal-400 cursor-not-allowed'
                : 'bg-forest-900 hover:bg-forest-800 text-white hover:shadow-md'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
