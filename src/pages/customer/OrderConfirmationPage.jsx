import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Package, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Store, 
  Calendar,
  Sparkles,
  Truck
} from 'lucide-react';
import { getOrderById } from '../../services/db';
import { formatCurrency, formatDateTime, getStatusBadge } from '../../utils/formatters';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    if (!order) {
      async function loadOrder() {
        setLoading(true);
        try {
          const data = await getOrderById(id);
          setOrder(data);
        } catch (err) {
          console.error('Error fetching order', err);
        } finally {
          setLoading(false);
        }
      }
      loadOrder();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, order]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-pulse space-y-4">
        <div className="w-16 h-16 rounded-full bg-cream-200 mx-auto"></div>
        <div className="h-6 w-48 bg-cream-200 rounded mx-auto"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
        <h2 className="text-xl font-bold text-charcoal-900">Order Not Found</h2>
        <p className="text-xs text-charcoal-500">Could not retrieve order details.</p>
        <Link to="/orders" className="text-xs font-bold text-forest-800 underline">
          View your order history
        </Link>
      </div>
    );
  }

  const steps = [
    { key: 'placed', label: 'Order Placed', desc: 'Received & inventory reserved' },
    { key: 'confirmed', label: 'Confirmed', desc: 'Accepted by local seller' },
    { key: 'preparing', label: 'Preparing', desc: 'Harvesting or morning bake' },
    { key: 'ready', label: 'Ready / Dispatched', desc: order.deliveryType === 'pickup' ? 'Ready for stall pickup' : 'On courier route' },
    { key: 'completed', label: 'Fulfilled', desc: 'Delivered to your door' },
  ];

  const currentStepIdx = steps.findIndex((s) => s.key === order.status);
  const statusInfo = getStatusBadge(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Celebration Header */}
      <div className="bg-forest-900 text-white rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl border border-forest-800">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-emerald-300 bg-forest-800/80 px-3 py-1 rounded-full mb-2">
          Payment Confirmed (Simulated)
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cream-50">
          Thank you for supporting local!
        </h1>

        <p className="text-forest-200 text-xs sm:text-sm max-w-md mx-auto mt-2 leading-relaxed">
          Order <strong>{order.orderNumber}</strong> has been transmitted to <strong>{order.sellerName}</strong>. Live inventory was verified and reserved.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-forest-200">
          <span className="flex items-center gap-1.5 bg-forest-950/60 px-3.5 py-1.5 rounded-full border border-forest-800">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Placed {formatDateTime(order.createdAt)}</span>
          </span>
          <span className="flex items-center gap-1.5 bg-forest-950/60 px-3.5 py-1.5 rounded-full border border-forest-800">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{order.deliveryType === 'pickup' ? 'Stall Pickup' : 'Neighborhood Delivery'}</span>
          </span>
        </div>
      </div>

      {/* Live Order Status Pipeline Tracker */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-300 shadow-subtle space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-charcoal-900 text-sm">Live Order Status Tracker</h3>
            <p className="text-xs text-charcoal-500">Updated in real-time as the seller prepares your provisions</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.bg}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Stepper Pipeline */}
        <div className="relative pt-4 pb-2">
          <div className="grid grid-cols-5 gap-2">
            {steps.map((step, idx) => {
              const isDone = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;
              return (
                <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                  <div 
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isDone
                        ? 'bg-forest-900 text-emerald-400 shadow-md ring-4 ring-emerald-50'
                        : 'bg-cream-200 text-charcoal-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <div>
                    <p className={`text-[11px] font-bold ${isCurrent ? 'text-forest-900' : 'text-charcoal-700'}`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-charcoal-400 hidden sm:block mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline Log */}
        {order.timeline && order.timeline.length > 0 && (
          <div className="border-t border-cream-200 pt-4 space-y-2">
            <h4 className="text-[11px] font-bold text-charcoal-700 uppercase tracking-wider">Status History</h4>
            <div className="space-y-1.5">
              {order.timeline.map((entry, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-charcoal-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-medium text-charcoal-800">{entry.note}</span>
                    <span className="text-[10px] text-charcoal-400">{formatDateTime(entry.time)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Line Items Receipt Breakdown */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-300 shadow-subtle space-y-6">
        <h3 className="font-serif text-lg font-bold text-charcoal-950 pb-3 border-b border-cream-200">
          Receipt & Fulfillment Details
        </h3>

        <div className="divide-y divide-cream-200">
          {order.items?.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-xs gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.productTitle}
                  className="w-12 h-12 rounded-xl object-cover border border-cream-200 bg-cream-100"
                />
                <div>
                  <h4 className="font-semibold text-charcoal-900">{item.productTitle}</h4>
                  <p className="text-charcoal-500 text-[11px]">
                    Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
              </div>
              <span className="font-bold text-forest-950">
                {formatCurrency(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Pricing calculations */}
        <div className="border-t border-cream-200 pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-charcoal-600">
            <span>Subtotal</span>
            <span className="font-semibold text-charcoal-900">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-charcoal-600">
            <span>Fulfillment</span>
            <span className="font-semibold text-charcoal-900">
              {order.deliveryFee === 0 ? 'FREE' : formatCurrency(order.deliveryFee)}
            </span>
          </div>
          <div className="flex justify-between text-charcoal-600">
            <span>Local Taxes</span>
            <span className="font-semibold text-charcoal-900">{formatCurrency(order.tax)}</span>
          </div>
          <div className="border-t border-cream-300 pt-3 flex justify-between items-baseline">
            <span className="font-bold text-sm text-charcoal-900">Total Paid</span>
            <span className="font-serif text-xl font-extrabold text-forest-950">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Delivery / Pickup address notes */}
        <div className="border-t border-cream-200 pt-4 text-xs text-charcoal-600 space-y-1">
          <span className="font-bold text-charcoal-900 block">Fulfillment Location:</span>
          {order.deliveryType === 'pickup' ? (
            <p>Direct Counter Pickup at {order.sellerName} ({order.deliveryAddress?.neighborhood || 'Eastside Mill'})</p>
          ) : (
            <p>{order.deliveryAddress?.street}, {order.deliveryAddress?.city} ({order.deliveryAddress?.neighborhood})</p>
          )}
          {order.deliveryAddress?.notes && (
            <p className="text-charcoal-500 italic mt-1">Note: "{order.deliveryAddress.notes}"</p>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/orders"
          className="w-full sm:w-auto text-center bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold px-6 py-3 rounded-full transition-colors shadow-md"
        >
          Track All Orders in History
        </Link>
        <Link
          to="/marketplace"
          className="text-xs font-semibold text-forest-800 hover:text-forest-950 flex items-center gap-1.5"
        >
          <span>Continue Discovering Goods</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
