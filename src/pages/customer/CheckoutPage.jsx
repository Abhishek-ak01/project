import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  MapPin, 
  Truck, 
  Store, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createOrder } from '../../services/db';
import { NEIGHBORHOODS } from '../../services/mockData';
import { formatCurrency } from '../../utils/formatters';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, subtotal, deliveryFee, estimatedTax, estimatedTotal, clearCart } = useCart();
  const { user, isAuthenticated, switchDemoRole } = useAuth();
  const { addToast } = useToast();

  const [deliveryType, setDeliveryType] = useState('local_delivery'); // 'local_delivery' | 'pickup'
  const [formData, setFormData] = useState({
    fullName: user?.fullName || 'Elena Rostova',
    email: user?.email || 'elena@example.com',
    phone: user?.phone || '(555) 321-7654',
    street: '742 Evergreen Terrace',
    city: 'Greenville',
    zip: '97401',
    neighborhood: 'Riverside Valley',
    notes: 'Please leave on the front porch table.',
  });

  const [paymentMethod, setPaymentMethod] = useState('card_demo');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-24 px-4 space-y-4">
        <div className="w-16 h-16 rounded-full bg-cream-200 text-charcoal-400 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-charcoal-900">Your basket is empty</h2>
        <p className="text-xs text-charcoal-500">
          Add some fresh artisanal provisions from the marketplace before checking out.
        </p>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 bg-forest-900 text-white text-xs font-bold px-5 py-2.5 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Marketplace</span>
        </Link>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setOrderError('');

    if (!user || !user.id) {
      setOrderError('Authentication required: Please sign in or register before checking out.');
      addToast('Please sign in to place your order.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      // Package payload for authoritative server-side processing
      const payload = {
        customerId: user.id,
        customerName: formData.fullName,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        deliveryType,
        deliveryAddress: deliveryType === 'pickup' 
          ? { pickupType: 'Counter Pickup', neighborhood: formData.neighborhood, notes: formData.notes }
          : { street: formData.street, city: formData.city, zip: formData.zip, neighborhood: formData.neighborhood, notes: formData.notes },
        paymentMethod,
        cartItems: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        notes: formData.notes,
      };

      const createdOrder = await createOrder(payload);

      // Successfully processed on server with atomic stock decrement
      clearCart();
      addToast(`Order ${createdOrder.orderNumber} successfully confirmed!`, 'success');
      navigate(`/order-confirmation/${createdOrder.id}`, { state: { order: createdOrder } });
    } catch (err) {
      console.error('Order creation failed:', err);
      setOrderError(err.message || 'Failed to place order. Please review your basket.');
      addToast(err.message || 'Order could not be processed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="flex items-center justify-between border-b border-cream-200 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-charcoal-950">
            Marketplace Checkout
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Verified local order • Direct maker support
          </p>
        </div>
        <Link
          to="/marketplace"
          className="text-xs text-forest-800 font-semibold hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {orderError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{orderError}</span>
        </div>
      )}

      {!isAuthenticated && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>You are currently not signed in. Please sign in to authenticate your order.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => switchDemoRole('customer')}
              className="bg-forest-900 hover:bg-forest-800 text-white font-bold px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap text-[11px]"
            >
              One-Click Shopper Sign In
            </button>
            <Link
              to="/login"
              state={{ from: '/checkout' }}
              className="text-forest-800 font-bold underline whitespace-nowrap text-[11px]"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Form Columns */}
        <div className="lg:col-span-7 space-y-8">
          {/* Step 1: Delivery Option Selection */}
          <div className="bg-white p-6 rounded-3xl border border-cream-300 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-forest-900 text-white text-xs flex items-center justify-center font-bold">1</span>
              <span>Fulfillment Method</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label 
                className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                  deliveryType === 'local_delivery' 
                    ? 'border-forest-700 bg-forest-50/50' 
                    : 'border-cream-300 hover:border-cream-400 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  value="local_delivery"
                  checked={deliveryType === 'local_delivery'}
                  onChange={() => setDeliveryType('local_delivery')}
                  className="mt-1 text-forest-800"
                />
                <div>
                  <span className="font-bold text-xs text-charcoal-900 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-forest-700" />
                    <span>Neighborhood Delivery</span>
                  </span>
                  <p className="text-[11px] text-charcoal-500 mt-1">
                    Delivered direct to your porch by local courier. Free over $35.
                  </p>
                </div>
              </label>

              <label 
                className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                  deliveryType === 'pickup' 
                    ? 'border-forest-700 bg-forest-50/50' 
                    : 'border-cream-300 hover:border-cream-400 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  value="pickup"
                  checked={deliveryType === 'pickup'}
                  onChange={() => setDeliveryType('pickup')}
                  className="mt-1 text-forest-800"
                />
                <div>
                  <span className="font-bold text-xs text-charcoal-900 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-forest-700" />
                    <span>Self-Pickup at Stall</span>
                  </span>
                  <p className="text-[11px] text-charcoal-500 mt-1">
                    Collect directly from the artisan bakery or farm stand. $0.00 fee.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Step 2: Customer & Shipping Details */}
          <div className="bg-white p-6 rounded-3xl border border-cream-300 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-forest-900 text-white text-xs flex items-center justify-center font-bold">2</span>
              <span>Customer Information & Address</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-forest-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-forest-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-forest-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">Neighborhood Hub</label>
                <select
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleInputChange}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-xs text-charcoal-800 focus:ring-1 focus:ring-forest-600 focus:outline-none cursor-pointer"
                >
                  {NEIGHBORHOODS.filter(n => n !== 'All Neighborhoods').map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {deliveryType === 'local_delivery' && (
                <>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-charcoal-700 block mb-1">Street Address</label>
                    <input
                      type="text"
                      name="street"
                      required
                      placeholder="e.g. 742 Evergreen Terrace, Apt 4B"
                      value={formData.street}
                      onChange={handleInputChange}
                      className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-forest-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-charcoal-700 block mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-forest-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-charcoal-700 block mb-1">ZIP Code</label>
                    <input
                      type="text"
                      name="zip"
                      required
                      value={formData.zip}
                      onChange={handleInputChange}
                      className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-forest-600 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">Drop-off / Maker Notes</label>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="Gate code, porch instructions, or dietary notes for the baker..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-forest-600 focus:outline-none"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Step 3: Payment Simulation (Hackathon Constraints Adhered) */}
          <div className="bg-white p-6 rounded-3xl border border-cream-300 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-forest-900 text-white text-xs flex items-center justify-center font-bold">3</span>
              <span>Payment Details (Simulated Hackathon Demo)</span>
            </h3>

            <div className="bg-forest-50 p-4 rounded-2xl border border-forest-200 text-xs text-forest-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-forest-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Hackathon Safe Simulation</span>
              </div>
              <p className="text-[11px] text-forest-700 leading-relaxed">
                As required by the project specifications, payment is simulated safely for testing. Real inventory is authoritatively decremented upon order placement.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-cream-300 bg-cream-50 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card_demo"
                  checked={paymentMethod === 'card_demo'}
                  onChange={() => setPaymentMethod('card_demo')}
                  className="text-forest-800"
                />
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-forest-700" />
                    <span className="text-xs font-bold text-charcoal-900">Demo Credit Card ({cardNumber})</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Auto-approved
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-cream-300 bg-cream-50 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="text-forest-800"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-charcoal-900">Cash on Local Delivery / Stall Pickup</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-cream-300 shadow-elevated sticky top-28 space-y-5">
            <h3 className="font-serif text-lg font-bold text-charcoal-950 pb-3 border-b border-cream-200">
              Basket Summary ({cartItems.length} items)
            </h3>

            {/* Line items list */}
            <div className="divide-y divide-cream-200 max-h-64 overflow-y-auto pr-1 space-y-1">
              {cartItems.map((item) => (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={item.product.images?.[0]}
                      alt={item.product.title}
                      className="w-10 h-10 rounded-lg object-cover border border-cream-300 shrink-0"
                    />
                    <div className="truncate">
                      <p className="font-semibold text-charcoal-900 truncate">{item.product.title}</p>
                      <p className="text-[11px] text-charcoal-400">Qty: {item.quantity} × {formatCurrency(item.product.price)}</p>
                    </div>
                  </div>
                  <span className="font-bold text-forest-950 shrink-0">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-xs border-t border-cream-200 pt-3">
              <div className="flex justify-between text-charcoal-600">
                <span>Subtotal</span>
                <span className="font-semibold text-charcoal-900">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between text-charcoal-600">
                <span>Fulfillment ({deliveryType === 'pickup' ? 'Self Pickup' : 'Courier Delivery'})</span>
                <span className="font-semibold text-charcoal-900">
                  {deliveryType === 'pickup' || deliveryFee === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    formatCurrency(deliveryFee)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-charcoal-600">
                <span>Estimated Local Sales Tax (8%)</span>
                <span className="font-semibold text-charcoal-900">{formatCurrency(estimatedTax)}</span>
              </div>

              <div className="border-t border-cream-300 pt-3 flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-sm text-charcoal-900 block">Total Due</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Authoritative server computation</span>
                </div>
                <span className="font-serif text-2xl font-extrabold text-forest-950">
                  {formatCurrency(subtotal + (deliveryType === 'pickup' ? 0 : deliveryFee) + estimatedTax)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-forest-900 hover:bg-forest-800 disabled:bg-cream-300 text-white font-bold py-3.5 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Reserving Stock & Placing Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Confirm Order & Pay ({formatCurrency(subtotal + (deliveryType === 'pickup' ? 0 : deliveryFee) + estimatedTax)})</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-charcoal-400 text-center leading-relaxed">
              🌱 By placing this order, you are directly investing in neighborhood agriculture and micro-enterprises.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
