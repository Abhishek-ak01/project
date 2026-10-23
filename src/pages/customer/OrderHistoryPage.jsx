import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Truck, 
  Store,
  ChevronRight
} from 'lucide-react';
import { getCustomerOrders } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime, getStatusBadge } from '../../utils/formatters';

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const data = await getCustomerOrders(user?.id);
        setOrders(data);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'active') return ['placed', 'confirmed', 'preparing', 'ready'].includes(o.status);
    if (activeTab === 'completed') return o.status === 'completed';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-cream-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Account Provisions</span>
          <h1 className="font-serif text-3xl font-bold text-charcoal-950 mt-1">
            Order History & Tracking
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Track status updates from local bakers, urban orchards, and micro-roasters.
          </p>
        </div>

        <Link
          to="/marketplace"
          className="text-xs font-bold bg-forest-900 text-white hover:bg-forest-800 px-4 py-2.5 rounded-full transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
          <span>New Order</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-cream-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'all' ? 'bg-forest-900 text-white' : 'text-charcoal-600 hover:bg-cream-200'
          }`}
        >
          All Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'active' ? 'bg-forest-900 text-white' : 'text-charcoal-600 hover:bg-cream-200'
          }`}
        >
          In Progress ({orders.filter(o => ['placed', 'confirmed', 'preparing', 'ready'].includes(o.status)).length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'completed' ? 'bg-forest-900 text-white' : 'text-charcoal-600 hover:bg-cream-200'
          }`}
        >
          Fulfilled ({orders.filter(o => o.status === 'completed').length})
        </button>
      </div>

      {/* Orders List */}
      {!user ? (
        <div className="bg-white rounded-3xl border border-cream-300 p-12 text-center space-y-4 shadow-subtle">
          <div className="w-16 h-16 rounded-full bg-cream-200 text-charcoal-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8 text-forest-700" />
          </div>
          <h3 className="font-bold text-lg text-charcoal-900">Sign in to view your orders</h3>
          <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
            Please log in or select a customer persona from the top navigation banner to track your local orders.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/login"
              className="bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-sm transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/marketplace"
              className="bg-cream-100 hover:bg-cream-200 text-charcoal-800 text-xs font-bold px-5 py-2.5 rounded-full border border-cream-300 transition-all"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 rounded-3xl bg-cream-200 animate-pulse"></div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-cream-300 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-cream-200 text-charcoal-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-charcoal-900">No orders found</h3>
          <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
            {activeTab === 'active' 
              ? 'You have no orders currently in preparation.' 
              : 'You have not placed any orders yet. Discover our fresh neighborhood marketplace today!'}
          </p>
          <Link
            to="/marketplace"
            className="inline-block bg-forest-900 text-white text-xs font-bold px-5 py-2.5 rounded-full"
          >
            Explore Provisions
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusBadge(order.status);
            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 border border-cream-300 shadow-subtle hover:border-forest-500 hover:shadow-elevated transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left: Order Info & Items Preview */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-serif font-bold text-base text-charcoal-950">
                      {order.orderNumber}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.bg}`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-xs text-charcoal-400">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-forest-800 font-semibold">
                    <Store className="w-3.5 h-3.5 text-forest-600" />
                    <span>{order.sellerName}</span>
                    <span className="text-charcoal-400">•</span>
                    <span className="text-charcoal-600 font-normal">
                      {order.deliveryType === 'pickup' ? 'Stall Pickup' : 'Neighborhood Delivery'}
                    </span>
                  </div>

                  {/* Line Items Thumbnails Preview */}
                  <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-cream-100 rounded-xl px-2 py-1 border border-cream-200 shrink-0">
                        <img
                          src={item.image}
                          alt={item.productTitle}
                          className="w-6 h-6 rounded-md object-cover"
                        />
                        <span className="text-[11px] font-medium text-charcoal-800 truncate max-w-[140px]">
                          {item.productTitle}
                        </span>
                        <span className="text-[10px] text-charcoal-400 font-bold">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Total & Action */}
                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-cream-200 gap-3 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-charcoal-400 block">Total</span>
                    <span className="font-serif text-lg font-extrabold text-forest-950">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>

                  <Link
                    to={`/order-confirmation/${order.id}`}
                    state={{ order }}
                    className="inline-flex items-center gap-1 bg-cream-100 hover:bg-forest-900 hover:text-white text-forest-950 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                  >
                    <span>Track Order</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
