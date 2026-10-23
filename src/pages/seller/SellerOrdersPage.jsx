import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Truck, 
  Store, 
  MapPin, 
  AlertCircle,
  Filter,
  Check,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getSellerOrders, updateOrderStatus } from '../../services/db';
import { formatCurrency, formatDateTime, getStatusBadge } from '../../utils/formatters';

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const sellerId = user?.sellerId || 'seller-1';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingOrderId, setProcessingOrderId] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getSellerOrders(sellerId);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load seller orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [sellerId]);

  const handleStatusTransition = async (orderId, newStatus) => {
    setProcessingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus, sellerId);
      addToast(`Order advanced to "${newStatus.replace('_', ' ').toUpperCase()}"`, 'success');
      loadOrders();
    } catch (err) {
      addToast(err.message || 'Status transition denied', 'error');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-200 pb-5">
        <div>
          <Link
            to="/seller/dashboard"
            className="text-xs font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="font-serif text-3xl font-bold text-charcoal-950">
            Fulfillment & Order Pipeline
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Accept incoming neighborhood requests, bake or harvest, and advance permitted delivery stages.
          </p>
        </div>

        <div className="text-xs bg-forest-50 border border-forest-200 text-forest-900 px-3.5 py-2 rounded-2xl font-semibold">
          Active Stalls: {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length} orders pending
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {['all', 'placed', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
              statusFilter === tab
                ? 'bg-forest-900 text-white shadow-sm'
                : 'bg-white text-charcoal-700 hover:bg-cream-100 border border-cream-300'
            }`}
          >
            {tab === 'all' ? `All (${orders.length})` : `${tab.replace('_', ' ')} (${orders.filter(o => o.status === tab).length})`}
          </button>
        ))}
      </div>

      {/* Orders List / Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-cream-200 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-cream-300 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-cream-200 text-charcoal-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-charcoal-900">No orders in this stage</h3>
          <p className="text-xs text-charcoal-500">
            Select another status filter tab to review past fulfillments.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusBadge(order.status);
            const isProcessing = processingOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-cream-300 shadow-subtle space-y-5"
              >
                {/* Top Row: Order Number, Customer, Date, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cream-200">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-serif text-lg font-bold text-charcoal-950">
                      {order.orderNumber}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.bg}`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-xs text-charcoal-400">
                      Placed {formatDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-charcoal-400 uppercase font-bold block">Order Value</span>
                    <span className="font-serif text-lg font-extrabold text-forest-950">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Middle Row: Customer Info & Items */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Customer details */}
                  <div className="md:col-span-4 space-y-2 text-xs text-charcoal-600 bg-cream-50 p-4 rounded-2xl border border-cream-200">
                    <h4 className="font-bold text-charcoal-900 text-xs">Customer & Destination</h4>
                    <p className="font-medium text-charcoal-800">{order.customerName}</p>
                    <p>{order.customerPhone}</p>
                    <div className="pt-1 flex items-start gap-1.5 text-forest-800">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        {order.deliveryType === 'pickup' 
                          ? 'Customer pickup at stall' 
                          : `${order.deliveryAddress?.street || 'Local street'}, ${order.deliveryAddress?.neighborhood || 'Riverside'}`}
                      </span>
                    </div>
                    {order.deliveryAddress?.notes && (
                      <p className="text-[11px] text-charcoal-500 italic pt-1">
                        "{order.deliveryAddress.notes}"
                      </p>
                    )}
                  </div>

                  {/* Line items ordered */}
                  <div className="md:col-span-8 space-y-2.5">
                    <h4 className="font-bold text-charcoal-900 text-xs">Line Items to Pack</h4>
                    <div className="divide-y divide-cream-200">
                      {order.items?.map((item) => (
                        <div key={item.id} className="py-2 flex items-center justify-between text-xs gap-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={item.image}
                              alt={item.productTitle}
                              className="w-10 h-10 rounded-lg object-cover border border-cream-200 shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-charcoal-900">{item.productTitle}</p>
                              <p className="text-[11px] text-charcoal-400">
                                Qty: <strong>{item.quantity}</strong> × {formatCurrency(item.unitPrice)}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-forest-950">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Permitted Status Action Stepper Buttons */}
                <div className="pt-4 border-t border-cream-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-charcoal-500">
                    Next permitted action:
                  </div>

                  <div className="flex items-center gap-2.5">
                    {order.status === 'placed' && (
                      <>
                        <button
                          onClick={() => handleStatusTransition(order.id, 'confirmed')}
                          disabled={isProcessing}
                          className="bg-forest-900 hover:bg-forest-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Accept & Confirm Order</span>
                        </button>
                        <button
                          onClick={() => handleStatusTransition(order.id, 'cancelled')}
                          disabled={isProcessing}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3 py-2 rounded-xl border border-rose-200 transition-colors"
                        >
                          Decline / Cancel
                        </button>
                      </>
                    )}

                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusTransition(order.id, 'preparing')}
                        disabled={isProcessing}
                        className="bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Clock className="w-4 h-4 text-purple-300" />
                        <span>Start Preparation / Baking</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleStatusTransition(order.id, 'ready')}
                        disabled={isProcessing}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Truck className="w-4 h-4 text-emerald-200" />
                        <span>
                          {order.deliveryType === 'pickup' ? 'Mark Ready for Customer Pickup' : 'Dispatch for Local Delivery'}
                        </span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleStatusTransition(order.id, 'completed')}
                        disabled={isProcessing}
                        className="bg-forest-900 hover:bg-forest-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Mark Delivered / Completed</span>
                      </button>
                    )}

                    {order.status === 'completed' && (
                      <span className="text-xs font-bold text-forest-800 flex items-center gap-1 bg-forest-50 px-3 py-1.5 rounded-xl border border-forest-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Order Completed & Fulfilled</span>
                      </span>
                    )}

                    {order.status === 'cancelled' && (
                      <span className="text-xs font-bold text-rose-700 flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Order Cancelled</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
