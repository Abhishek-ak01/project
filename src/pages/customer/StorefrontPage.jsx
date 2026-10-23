import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  Truck, 
  Store,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { getSellerById } from '../../services/db';
import ProductCard from '../../components/customer/ProductCard';

export default function StorefrontPage() {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSeller() {
      setLoading(true);
      try {
        const data = await getSellerById(id);
        setSeller(data);
      } catch (err) {
        console.error('Failed to load seller storefront', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSeller();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-48 bg-cream-200 rounded-3xl"></div>
        <div className="h-8 bg-cream-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4 space-y-4">
        <h2 className="text-2xl font-bold text-charcoal-900">Seller Not Found</h2>
        <p className="text-xs text-charcoal-500">
          This seller profile could not be found or has moved.
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Store Header Banner */}
      <div className="bg-white rounded-3xl overflow-hidden border border-cream-300 shadow-elevated">
        <div className="relative h-48 sm:h-64 bg-cream-100 overflow-hidden">
          <img
            src={seller.bannerUrl}
            alt={seller.storeName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 via-transparent to-transparent"></div>
        </div>

        <div className="p-6 sm:p-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white overflow-hidden shadow-xl bg-white shrink-0">
                <img
                  src={seller.logoUrl}
                  alt={seller.storeName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-950">
                    {seller.storeName}
                  </h1>
                  {seller.isVerified && (
                    <span title="Verified Producer" className="text-emerald-600">
                      <ShieldCheck className="w-5 h-5 fill-emerald-100" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-forest-800 font-semibold flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{seller.address}, {seller.neighborhood}</span>
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 text-xs">
              <div className="bg-cream-100 px-3.5 py-2 rounded-xl border border-cream-300 text-center">
                <span className="font-bold text-charcoal-900 block text-sm">★ {seller.rating}</span>
                <span className="text-[10px] text-charcoal-500">{seller.reviewCount} Reviews</span>
              </div>
              <div className="bg-cream-100 px-3.5 py-2 rounded-xl border border-cream-300 text-center">
                <span className="font-bold text-charcoal-900 block text-sm">{seller.products?.length || 0}</span>
                <span className="text-[10px] text-charcoal-500">Products</span>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed max-w-3xl pt-2">
            {seller.description}
          </p>

          <div className="flex flex-wrap gap-2 pt-4">
            {seller.badges?.map((badge, idx) => (
              <span key={idx} className="bg-forest-50 text-forest-800 font-semibold text-xs px-3 py-1 rounded-full border border-forest-200">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Seller Catalog */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-charcoal-950">
            Available Provisions ({seller.products?.length || 0})
          </h2>
          <span className="text-xs text-charcoal-500">
            Freshly prepared by {seller.storeName}
          </span>
        </div>

        {seller.products?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-300 p-8 text-center text-xs text-charcoal-500">
            This seller currently has no active products listed.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {seller.products?.map((p) => (
              <ProductCard 
                key={p.id} 
                product={{
                  ...p,
                  sellerName: seller.storeName,
                  sellerSlug: seller.slug,
                  originNeighborhood: seller.neighborhood,
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
