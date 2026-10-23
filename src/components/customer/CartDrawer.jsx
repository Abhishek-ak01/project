import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Truck 
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';

export default function CartDrawer() {
  const navigate = useNavigate();
  const { 
    cartItems, 
    isCartOpen, 
    closeCart, 
    updateQuantity, 
    removeFromCart, 
    subtotal, 
    totalItems,
    freeDeliveryThreshold,
    qualifiesForFreeDelivery,
    deliveryFee
  } = useCart();

  if (!isCartOpen) return null;

  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  const handleCheckoutClick = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-charcoal-950/50 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-cream-300 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-cream-300 flex items-center justify-between bg-cream-50">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-forest-900 text-emerald-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-forest-950 text-base">Your Market Basket</h3>
                <p className="text-xs text-charcoal-500">{totalItems} {totalItems === 1 ? 'item' : 'items'} from local makers</p>
              </div>
            </div>

            <button
              onClick={closeCart}
              className="p-2 rounded-full text-charcoal-400 hover:text-charcoal-700 hover:bg-cream-200 transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Meter */}
          {cartItems.length > 0 && (
            <div className="bg-forest-50 px-5 py-3 border-b border-forest-100">
              <div className="flex items-center justify-between text-xs font-medium text-forest-900 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-forest-600" />
                  {qualifiesForFreeDelivery ? (
                    <span className="font-bold text-emerald-700">You unlocked FREE local delivery!</span>
                  ) : (
                    <span>Add <strong>{formatCurrency(amountNeededForFreeDelivery)}</strong> for free delivery</span>
                  )}
                </span>
                <span className="text-[11px] text-forest-600 font-semibold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-forest-200/60 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-cream-200">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-cream-200 flex items-center justify-center text-charcoal-400 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-charcoal-800">Your basket is currently empty</h4>
                <p className="text-xs text-charcoal-500 max-w-xs mt-1.5 leading-relaxed">
                  Support your local community bakeries, micro-creameries, and farmers by filling your basket with fresh goods.
                </p>
                <button
                  onClick={() => { closeCart(); navigate('/marketplace'); }}
                  className="mt-6 bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors shadow-sm"
                >
                  Explore Local Goods
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.product.id} className="py-4 first:pt-0 flex gap-3.5">
                  {/* Thumbnail */}
                  <img
                    src={item.product.images?.[0]}
                    alt={item.product.title}
                    className="w-16 h-16 rounded-xl object-cover border border-cream-200 shrink-0 bg-cream-100"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold text-charcoal-900 text-xs leading-snug line-clamp-1">
                          {item.product.title}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-charcoal-400 hover:text-rose-600 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-forest-700 font-medium mt-0.5 truncate">
                        {item.product.sellerName || 'Local Maker'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-cream-300 rounded-lg bg-cream-50">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 text-charcoal-600 hover:text-charcoal-900 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-charcoal-900 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stockQuantity}
                          className="p-1 text-charcoal-600 hover:text-charcoal-900 disabled:opacity-40 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <span className="text-xs font-bold text-forest-950">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-cream-300 bg-cream-50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-charcoal-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-charcoal-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-charcoal-600">
                  <span>Estimated Delivery</span>
                  <span className="font-semibold text-charcoal-900">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      formatCurrency(deliveryFee)
                    )}
                  </span>
                </div>
              </div>

              <div className="border-t border-cream-300 pt-2 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold text-charcoal-900 block">Estimated Total</span>
                  <span className="text-[10px] text-charcoal-400">Taxes calculated at checkout</span>
                </div>
                <span className="text-lg font-extrabold text-forest-950">
                  {formatCurrency(subtotal + deliveryFee)}
                </span>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="w-full bg-forest-900 hover:bg-forest-800 text-white font-bold py-3 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>

              <p className="text-[11px] text-center text-charcoal-400">
                🔒 Inventory is reserved and verified at checkout.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
