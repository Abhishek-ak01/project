import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  MapPin, 
  Star, 
  Sparkles, 
  ShieldCheck, 
  Leaf, 
  Truck, 
  Clock, 
  CheckCircle2, 
  Store, 
  Search,
  Users
} from 'lucide-react';
import ProductCard from '../../components/customer/ProductCard';
import { getProducts, getCategories, getSellers } from '../../services/db';

export default function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroSearch, setHeroSearch] = useState('');

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const [prodData, catData, sellerData] = await Promise.all([
          getProducts(),
          getCategories(),
          getSellers(),
        ]);
        setProducts(prodData);
        setCategories(catData);
        setSellers(sellerData);
      } catch (err) {
        console.error('Failed to load home page data', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/marketplace');
    }
  };

  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 8);
  const newArrivals = products.slice(-4);

  return (
    <div className="space-y-16 pb-20">
      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden bg-forest-950 text-white pt-12 pb-20 sm:pb-24 lg:pt-16 lg:pb-28">
        {/* Subtle decorative background gradient */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500 blur-3xl"></div>
          <div className="absolute bottom-0 left-10 w-80 h-80 rounded-full bg-forest-400 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline, Subtitle, Search, Social Proof */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-800/80 border border-forest-700/60 text-xs font-semibold text-emerald-300">
                <Leaf className="w-3.5 h-3.5" />
                <span>Harvested & baked within 25 miles of you</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-cream-50 leading-[1.12]">
                Fresh Choices, <br />
                <span className="italic font-normal text-emerald-400">Better Neighborhood Life.</span>
              </h1>

              <p className="text-forest-200 text-sm sm:text-base max-w-xl leading-relaxed">
                Skip industrial supply chains and grocery markups. Discover hearth sourdough, vine-ripened organic produce, and pure raw honey directly from local producers.
              </p>

              {/* Instant Search Bar */}
              <form onSubmit={handleHeroSearch} className="max-w-lg flex items-center bg-white rounded-2xl p-1.5 shadow-2xl">
                <div className="flex-1 flex items-center pl-3.5 gap-2">
                  <Search className="w-4 h-4 text-charcoal-400 shrink-0" />
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Search sourdough, crisp apples, raw honey..."
                    className="w-full text-charcoal-900 placeholder-charcoal-400 text-xs sm:text-sm bg-transparent focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-forest-900 hover:bg-forest-800 text-white text-xs sm:text-sm font-bold px-5 py-2.5 sm:py-3 rounded-xl transition-colors shadow-md flex items-center gap-1.5"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              </form>

              {/* Social Proof Stats */}
              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-forest-200">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <img className="w-7 h-7 rounded-full border-2 border-forest-900 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Neighbor" />
                    <img className="w-7 h-7 rounded-full border-2 border-forest-900 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Neighbor" />
                    <img className="w-7 h-7 rounded-full border-2 border-forest-900 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="Neighbor" />
                  </div>
                  <div>
                    <div className="flex text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400" />
                    </div>
                    <span className="font-semibold text-white">4.9 / 5</span> from 4,800+ local orders
                  </div>
                </div>

                <div className="h-6 w-px bg-forest-800 hidden sm:block"></div>

                <div className="flex items-center gap-1.5 text-forest-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified Local Makers</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Card (Organic Harvest Composition) */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-forest-800/80 shadow-2xl bg-forest-900/60 aspect-[4/3] sm:aspect-square">
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
                  alt="Fresh local market basket"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-transparent"></div>

                {/* Floating highlight card */}
                <div className="absolute bottom-4 left-4 right-4 bg-forest-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-forest-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-forest-800 flex items-center justify-center text-emerald-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Morning Farm Harvest</p>
                      <p className="text-[11px] text-forest-300">Produce cut & packed at 6:30 AM</p>
                    </div>
                  </div>
                  <Link
                    to="/marketplace?category=cat-produce"
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>View Drop</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Badges Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
        <div className="bg-white rounded-2xl shadow-elevated border border-cream-300 grid grid-cols-2 lg:grid-cols-4 p-4 sm:p-6 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-cream-200">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-charcoal-900 text-xs sm:text-sm">100% Neighborhood</p>
              <p className="text-[11px] text-charcoal-500">Zero cross-country freight</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-charcoal-900 text-xs sm:text-sm">Eco Delivery & Pickup</p>
              <p className="text-[11px] text-charcoal-500">Free delivery on $35+</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-charcoal-900 text-xs sm:text-sm">Verified Producers</p>
              <p className="text-[11px] text-charcoal-500">Vetted for hygiene & ethics</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-charcoal-900 text-xs sm:text-sm">Direct Economic Impact</p>
              <p className="text-[11px] text-charcoal-500">Keeps 93% with local makers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Showcase Section (Editorial Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Explore Neighborhood Stalls</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-950 mt-1">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/marketplace"
            className="text-xs sm:text-sm font-semibold text-forest-800 hover:text-forest-950 flex items-center gap-1 group"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/marketplace?category=${cat.id}`}
              className="group bg-white rounded-2xl p-4 border border-cream-300 hover:border-forest-500 hover:shadow-elevated transition-all duration-300 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-cream-100 group-hover:bg-forest-50 text-forest-700 flex items-center justify-center mb-3 transition-colors">
                <Leaf className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-bold text-charcoal-900 text-xs sm:text-sm group-hover:text-forest-800 transition-colors">
                {cat.name}
              </h3>
              <p className="text-[11px] text-charcoal-400 mt-1 line-clamp-1">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* From Farm To Home Story Banner (Inspired by Rivora Reference) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-forest-900 text-white rounded-3xl overflow-hidden border border-forest-800 shadow-xl grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Neighborhood Story</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
                From Our Neighborhood Plots <br />
                Direct to Your Kitchen Table.
              </h2>
              <p className="text-forest-200 text-xs sm:text-sm leading-relaxed max-w-lg">
                Unlike grocery conglomerates where produce travels an average of 1,500 miles and sits in cold warehouses for weeks, our producers harvest same-day. You enjoy unmatched nutrient density, taste, and true community connection.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-forest-800 text-center">
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-400">50+</p>
                <p className="text-[11px] text-forest-300">Local Small Farms</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-400">100%</p>
                <p className="text-[11px] text-forest-300">Traceable Provenance</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-400">4.9★</p>
                <p className="text-[11px] text-forest-300">Customer Satisfaction</p>
              </div>
            </div>

            <div>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-forest-950 font-bold px-6 py-3 rounded-full text-xs sm:text-sm transition-all shadow-md"
              >
                <span>Taste the Local Difference</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full">
            <img
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80"
              alt="Local organic farm plot"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-forest-900 lg:from-forest-900/70 via-transparent to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Curated Favorites</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-950 mt-1">
              Best-Selling Local Goods
            </h2>
          </div>
          <Link
            to="/marketplace?sort=featured"
            className="text-xs sm:text-sm font-semibold text-forest-800 hover:text-forest-950 flex items-center gap-1 group"
          >
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-cream-200 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Featured Sellers / Storefront Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="sellers">
        <div className="bg-cream-200/50 rounded-3xl p-6 sm:p-10 border border-cream-300">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Neighborhood Pillars</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-950 mt-1">
                Meet the Artisans & Growers
              </h2>
              <p className="text-xs text-charcoal-500 mt-1 max-w-md">
                Get to know the independent bakers, beekeepers, and farmers behind your weekly provisions.
              </p>
            </div>
            <Link
              to="/register?role=seller"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full bg-forest-900 text-white hover:bg-forest-800 transition-colors shrink-0"
            >
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span>Register Your Store</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sellers.slice(0, 3).map((seller) => (
              <div
                key={seller.id}
                className="bg-white rounded-2xl overflow-hidden border border-cream-300 hover:border-forest-500 hover:shadow-elevated transition-all flex flex-col justify-between"
              >
                {/* Store banner & logo */}
                <div>
                  <div className="relative h-28 bg-cream-100 overflow-hidden">
                    <img
                      src={seller.bannerUrl}
                      alt={seller.storeName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute -bottom-4 left-4 w-12 h-12 rounded-xl border-2 border-white overflow-hidden shadow-md">
                      <img
                        src={seller.logoUrl}
                        alt={seller.storeName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="pt-6 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-charcoal-950 text-sm">
                        {seller.storeName}
                      </h3>
                      <span className="flex items-center text-xs font-bold text-amber-600">
                        ★ {seller.rating}
                      </span>
                    </div>

                    <p className="text-[11px] text-forest-700 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>{seller.neighborhood}</span>
                    </p>

                    <p className="text-xs text-charcoal-500 mt-2 line-clamp-2 leading-relaxed">
                      {seller.tagline || seller.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {seller.badges?.slice(0, 2).map((b, i) => (
                        <span key={i} className="text-[10px] bg-forest-50 text-forest-800 px-2 py-0.5 rounded-full font-semibold border border-forest-200">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Link
                    to={`/store/${seller.slug || seller.id}`}
                    className="w-full block text-center text-xs font-bold py-2 rounded-xl bg-cream-100 hover:bg-forest-900 hover:text-white text-forest-950 transition-colors"
                  >
                    Visit Storefront
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Innovation Highlight: Explainable Local Discovery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-emerald-200 bg-emerald-50/50 rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Local Innovation</span>
            <h3 className="font-serif text-2xl font-bold text-forest-950">
              Compare Local Sellers Side-by-Side
            </h3>
            <p className="text-xs sm:text-sm text-forest-800 leading-relaxed">
              Wondering how sourdough from Eastside Mill compares with riverside loaves in crust, price, or wild fermentation? Use our one-click product comparison tool to make transparent neighborhood choices.
            </p>
          </div>
          <Link
            to="/marketplace"
            className="bg-forest-900 hover:bg-forest-800 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-full transition-all shrink-0 shadow-md"
          >
            Try Product Comparison
          </Link>
        </div>
      </section>
    </div>
  );
}
