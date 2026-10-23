import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  Store, 
  ExternalLink,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { getSellerAnalytics, getSellerOrders } from '../../services/db';
import { formatCurrency, formatDateTime, getStatusBadge } from '../../utils/formatters';

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const sellerId = user?.sellerId || 'seller-1';

  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [stats, orders] = await Promise.all([
          getSellerAnalytics(sellerId),
          getSellerOrders(sellerId),
        ]);
        setAnalytics(stats);
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error('Failed to load seller analytics', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-10 bg-cream-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-cream-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Seller Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-forest-700 uppercase tracking-wider">
            <Store className="w-3.5 h-3.5" />
            <span>Seller Command Center</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-charcoal-950 mt-1">
            {user?.storeName || 'Crust & Crumb Bakery'}
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Real-time sales, live inventory, and neighborhood order fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/seller/products"
            className="inline-flex items-center gap-1.5 bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold px-4 py-2.5 rounded-full transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Manage Products</span>
          </Link>

          <Link
            to="/seller/orders"
            className="inline-flex items-center gap-1.5 bg-cream-200 hover:bg-cream-300 text-charcoal-800 text-xs font-bold px-4 py-2.5 rounded-full transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-forest-700" />
            <span>Process Orders</span>
          </Link>

          <Link
            to={`/store/crust-and-crumb`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-800 hover:text-forest-950 px-2 py-1"
            title="Preview Public Storefront"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Storefront</span>
          </Link>
        </div>
      </div>

      {/* Low Stock Urgent Alert Banner */}
      {analytics?.lowStockProducts && analytics.lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-sm">
                Low Inventory Notice ({analytics.lowStockProducts.length} items with &lt; 5 units)
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {analytics.lowStockProducts.map(p => `${p.title} (${p.stockQuantity} left)`).join(' • ')}
              </p>
            </div>
          </div>
          <Link
            to="/seller/products"
            className="bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0 self-start sm:self-auto"
          >
            Restock Inventory
          </Link>
        </div>
      )}

      {/* Overview KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-cream-300 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">Gross Sales</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl font-extrabold text-charcoal-950">
              {formatCurrency(analytics?.totalRevenue || 0)}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% from last harvest cycle</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-cream-300 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl font-extrabold text-charcoal-950">
              {analytics?.totalOrdersCount || 0}
            </span>
            <p className="text-[11px] text-charcoal-500 mt-1">
              Avg Order Value: {formatCurrency(analytics?.averageOrderValue || 0)}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-cream-300 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">Active Products</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl font-extrabold text-charcoal-950">
              {analytics?.activeProductsCount || 0}
            </span>
            <p className="text-[11px] text-charcoal-500 mt-1">
              All items currently discoverable
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-cream-300 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">Low Stock Warnings</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl font-extrabold text-charcoal-950">
              {analytics?.lowStockProducts?.length || 0}
            </span>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">
              Requires attention before morning bake
            </p>
          </div>
        </div>
      </div>

      {/* Sales Trend Chart & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sales Chart with Recharts */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-subtle space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal-950">7-Day Revenue Velocity</h3>
              <p className="text-xs text-charcoal-500">Daily sales generated across neighborhood orders</p>
            </div>
            <span className="text-xs font-bold text-forest-800 bg-forest-50 px-3 py-1 rounded-full border border-forest-200">
              Weekly Overview
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.revenueChartData || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#226b4d" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#226b4d" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f2eee3" vertical={false} />
                <XAxis dataKey="name" stroke="#758774" fontSize={11} tickLine={false} />
                <YAxis stroke="#758774" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Revenue']} 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e0cf', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#226b4d" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-subtle space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-cream-200">
            <h3 className="font-serif text-base font-bold text-charcoal-950">Top-Selling Provisions</h3>
            <span className="text-[11px] text-charcoal-400">By Units Sold</span>
          </div>

          <div className="space-y-4">
            {analytics?.topSelling?.map((prod, idx) => (
              <div key={prod.id} className="flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-cream-200 text-charcoal-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="font-semibold text-charcoal-900 truncate">{prod.title}</p>
                    <p className="text-[10px] text-charcoal-400">{prod.stockQuantity} remaining</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-forest-950 block">{prod.unitsSold || (4 - idx)} sold</span>
                  <span className="text-[10px] text-charcoal-500">{formatCurrency(prod.totalEarned || prod.price * (4 - idx))}</span>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/seller/products"
            className="w-full block text-center bg-cream-100 hover:bg-forest-900 hover:text-white text-forest-950 text-xs font-bold py-2.5 rounded-xl transition-colors mt-4"
          >
            View Full Inventory
          </Link>
        </div>
      </div>

      {/* Recent Orders Processing Quick Table */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-subtle space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-charcoal-950">Incoming Neighborhood Orders</h3>
            <p className="text-xs text-charcoal-500">Live order pipeline for customer fulfillment</p>
          </div>
          <Link
            to="/seller/orders"
            className="text-xs font-bold text-forest-800 hover:text-forest-950 flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-xs text-charcoal-400 py-6 text-center">No orders received yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100 text-charcoal-600 font-bold border-b border-cream-300">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {recentOrders.map((ord) => {
                  const statusInfo = getStatusBadge(ord.status);
                  return (
                    <tr key={ord.id} className="hover:bg-cream-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-charcoal-900">{ord.orderNumber}</td>
                      <td className="py-3.5 px-4 font-medium">{ord.customerName}</td>
                      <td className="py-3.5 px-4 text-charcoal-500">{ord.items?.length} items</td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize">{ord.deliveryType?.replace('_', ' ')}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-forest-950">{formatCurrency(ord.totalAmount)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.bg}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to="/seller/orders"
                          className="text-xs font-bold text-forest-700 hover:text-forest-900 underline"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
