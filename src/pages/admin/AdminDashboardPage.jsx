import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Store, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  ShoppingBag, 
  Trash2, 
  Flag, 
  Check, 
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  getAdminMarketplaceStats, 
  getProducts, 
  moderateProduct, 
  toggleSellerVerification 
} from '../../services/db';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sellers'); // 'sellers' | 'products' | 'logs'

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [adminStats, allProds] = await Promise.all([
        getAdminMarketplaceStats(),
        getProducts({}),
      ]);
      setStats(adminStats);
      setProducts(allProds);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleVerification = async (sellerId) => {
    try {
      const updated = await toggleSellerVerification(sellerId);
      addToast(`Seller "${updated.storeName}" verification status changed to ${updated.isVerified ? 'VERIFIED' : 'UNVERIFIED'}`, 'success');
      loadAdminData();
    } catch (err) {
      addToast(err.message || 'Verification update failed', 'error');
    }
  };

  const handleProductAction = async (productId, action) => {
    try {
      await moderateProduct(productId, action, `Moderated by ${user?.fullName || 'Admin'}`);
      addToast(`Listing ${action.toUpperCase()} action recorded`, 'info');
      loadAdminData();
    } catch (err) {
      addToast(err.message || 'Action failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-10 bg-cream-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-cream-200 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-800 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
            <span>Platform Governance</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-charcoal-950 mt-1">
            Marketplace Moderation & Oversight
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Admin: <strong>{user?.fullName}</strong> • Authenticated with supervisory privileges.
          </p>
        </div>

        <div className="bg-purple-50 text-purple-900 border border-purple-200 text-xs px-3.5 py-1.5 rounded-full font-semibold self-start sm:self-auto">
          Role: System Administrator
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-cream-300 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Marketplace GMV</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl font-extrabold text-charcoal-950">
              {formatCurrency(stats?.totalGMV || 0)}
            </span>
            <p className="text-[11px] text-charcoal-500 mt-1">Cumulative transacted volume</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-cream-300 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Active Stalls</span>
            <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl font-extrabold text-charcoal-950">
              {stats?.totalSellers || 0}
            </span>
            <p className="text-[11px] text-charcoal-500 mt-1">Vetted neighborhood businesses</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-cream-300 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Listed Provisions</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl font-extrabold text-charcoal-950">
              {stats?.totalProducts || 0}
            </span>
            <p className="text-[11px] text-charcoal-500 mt-1">Catalog items across categories</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-cream-300 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Audit Logs</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl font-extrabold text-charcoal-950">
              {stats?.moderationLogs?.length || 0}
            </span>
            <p className="text-[11px] text-charcoal-500 mt-1">Logged moderation decisions</p>
          </div>
        </div>
      </div>

      {/* Moderation Navigation Tabs */}
      <div className="flex border-b border-cream-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('sellers')}
          className={`pb-3 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'sellers' ? 'border-forest-800 text-forest-900' : 'border-transparent text-charcoal-400 hover:text-charcoal-700'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Seller Verification ({stats?.sellers?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'products' ? 'border-forest-800 text-forest-900' : 'border-transparent text-charcoal-400 hover:text-charcoal-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Listing Moderation & Safety ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'logs' ? 'border-forest-800 text-forest-900' : 'border-transparent text-charcoal-400 hover:text-charcoal-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Moderation Audit Trail ({stats?.moderationLogs?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Seller Verification Table */}
      {activeTab === 'sellers' && (
        <div className="bg-white rounded-3xl border border-cream-300 shadow-subtle overflow-hidden">
          <div className="p-5 border-b border-cream-200">
            <h3 className="font-serif text-base font-bold text-charcoal-950">Registered Seller Stalls</h3>
            <p className="text-xs text-charcoal-500">Verify legitimacy and hygiene standards of local sellers</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100 text-charcoal-700 font-bold border-b border-cream-300">
                <tr>
                  <th className="py-3 px-4">Store Name</th>
                  <th className="py-3 px-4">Neighborhood</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {stats?.sellers?.map((s) => (
                  <tr key={s.id} className="hover:bg-cream-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={s.logoUrl}
                          alt={s.storeName}
                          className="w-10 h-10 rounded-full object-cover border border-cream-300"
                        />
                        <div>
                          <span className="font-bold text-charcoal-900 block">{s.storeName}</span>
                          <span className="text-[11px] text-charcoal-400">{s.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-charcoal-700 font-medium">{s.neighborhood}</td>

                    <td className="py-3.5 px-4 font-semibold text-amber-700">★ {s.rating}</td>

                    <td className="py-3.5 px-4">
                      {s.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified Producer</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-charcoal-500 bg-cream-200 px-2.5 py-0.5 rounded-full">
                          <span>Unverified</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleVerification(s.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                          s.isVerified
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {s.isVerified ? 'Revoke Verification' : 'Grant Verified Badge'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Product Moderation Table */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-cream-300 shadow-subtle overflow-hidden">
          <div className="p-5 border-b border-cream-200">
            <h3 className="font-serif text-base font-bold text-charcoal-950">Marketplace Product Catalog Moderation</h3>
            <p className="text-xs text-charcoal-500">Identify inappropriate, mislabeled, or prohibited listings</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100 text-charcoal-700 font-bold border-b border-cream-300">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Seller</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Moderation State</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-cream-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.images?.[0]}
                          alt={p.title}
                          className="w-10 h-10 rounded-xl object-cover border border-cream-200 shrink-0"
                        />
                        <span className="font-bold text-charcoal-900">{p.title}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-charcoal-600 font-medium">{p.sellerName}</td>
                    <td className="py-3.5 px-4 font-bold text-forest-950">{formatCurrency(p.price)}</td>
                    <td className="py-3.5 px-4 text-charcoal-600">{p.stockQuantity} in stock</td>

                    <td className="py-3.5 px-4">
                      {p.isModerated ? (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                          Flagged for Review
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          Approved & Active
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.isModerated ? (
                          <button
                            onClick={() => handleProductAction(p.id, 'approve')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg"
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleProductAction(p.id, 'flag')}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[11px] px-2.5 py-1 rounded-lg"
                          >
                            Flag Listing
                          </button>
                        )}
                        <button
                          onClick={() => handleProductAction(p.id, 'remove')}
                          className="p-1 text-charcoal-400 hover:text-rose-600 rounded-lg"
                          title="Delist product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Moderation Audit Trail */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-cream-300 shadow-subtle p-6 space-y-4">
          <h3 className="font-serif text-base font-bold text-charcoal-950">Moderation Audit Logs</h3>
          <p className="text-xs text-charcoal-500">Every moderation intervention is timestamped and recorded.</p>

          {stats?.moderationLogs?.length === 0 ? (
            <p className="text-xs text-charcoal-400 py-6 text-center">No moderation events recorded in this session yet.</p>
          ) : (
            <div className="divide-y divide-cream-200">
              {stats?.moderationLogs?.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-charcoal-900 capitalize">{log.action}: </span>
                    <span className="text-charcoal-700">{log.targetName}</span>
                    {log.reason && <p className="text-[11px] text-charcoal-500 italic mt-0.5">{log.reason}</p>}
                  </div>
                  <span className="text-[11px] text-charcoal-400">{formatDateTime(log.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
