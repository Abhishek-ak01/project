import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Filter, 
  Search, 
  MapPin, 
  RotateCcw, 
  Sparkles, 
  Check, 
  SlidersHorizontal,
  ChevronDown,
  X
} from 'lucide-react';
import ProductCard from '../../components/customer/ProductCard';
import { getProducts, getCategories, getNeighborhoods } from '../../services/db';
import { useFavorites } from '../../context/FavoritesContext';

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { favorites } = useFavorites();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state initialized from URL params
  const categoryParam = searchParams.get('category') || 'all';
  const searchParam = searchParams.get('search') || '';
  const neighborhoodParam = searchParams.get('neighborhood') || 'All Neighborhoods';
  const filterFavoritesOnly = searchParams.get('filter') === 'favorites';

  const [search, setSearch] = useState(searchParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(neighborhoodParam);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    async function loadStaticFilters() {
      const [cats, neighs] = await Promise.all([getCategories(), getNeighborhoods()]);
      setCategories(cats);
      setNeighborhoods(neighs);
    }
    loadStaticFilters();
  }, []);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
    setSearch(searchParams.get('search') || '');
    setSelectedNeighborhood(searchParams.get('neighborhood') || 'All Neighborhoods');
  }, [searchParams]);

  useEffect(() => {
    async function fetchFilteredProducts() {
      setLoading(true);
      try {
        let data = await getProducts({
          category: selectedCategory,
          search,
          neighborhood: selectedNeighborhood,
          minPrice,
          maxPrice,
          inStockOnly,
          sortBy,
        });

        if (filterFavoritesOnly) {
          data = data.filter(p => favorites.includes(p.id));
        }

        setProducts(data);
      } catch (err) {
        console.error('Error fetching filtered products', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFilteredProducts();
  }, [selectedCategory, search, selectedNeighborhood, minPrice, maxPrice, inStockOnly, sortBy, filterFavoritesOnly, favorites]);

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    const newParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', catId);
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearch('');
    setSelectedNeighborhood('All Neighborhoods');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSortBy('featured');
    setSearchParams({});
  };

  const hasActiveFilters = 
    selectedCategory !== 'all' || 
    search !== '' || 
    selectedNeighborhood !== 'All Neighborhoods' || 
    minPrice !== '' || 
    maxPrice !== '' || 
    inStockOnly || 
    filterFavoritesOnly;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Editorial Header */}
      <div className="bg-cream-200/50 rounded-3xl p-6 sm:p-8 border border-cream-300">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">
            {filterFavoritesOnly ? 'Your Saved Items' : 'Local Stalls & Fresh Harvest'}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-950 mt-1">
            {filterFavoritesOnly ? 'Favorite Local Products' : 'Neighborhood Marketplace'}
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-2 leading-relaxed">
            Every product is freshly made or sustainably grown by independent artisans and small farms right in your region.
          </p>
        </div>

        {/* Category Horizontal Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-6 scrollbar-none">
          <button
            onClick={() => handleCategorySelect('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
              selectedCategory === 'all'
                ? 'bg-forest-900 text-white'
                : 'bg-white text-charcoal-700 hover:bg-cream-100 border border-cream-300'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === cat.id
                  ? 'bg-forest-900 text-white'
                  : 'bg-white text-charcoal-700 hover:bg-cream-100 border border-cream-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout (Sidebar Filters + Products Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-3 bg-white p-5 rounded-2xl border border-cream-300 shadow-subtle space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-cream-200">
            <h3 className="font-bold text-charcoal-900 text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-forest-700" />
              <span>Refine Stalls</span>
            </h3>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Search inside filter */}
          <div>
            <label className="text-xs font-bold text-charcoal-800 block mb-1.5">Search Keywords</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Product name, farm, tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
              <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Neighborhood filter */}
          <div>
            <label className="text-xs font-bold text-charcoal-800 block mb-1.5">Local Neighborhood</label>
            <div className="relative">
              <select
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-xs text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-forest-600 cursor-pointer"
              >
                {neighborhoods.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="text-xs font-bold text-charcoal-800 block mb-1.5">Price Range ($)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min ($)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="bg-cream-50 border border-cream-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
              <input
                type="number"
                placeholder="Max ($)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-cream-50 border border-cream-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>
          </div>

          {/* In-Stock Only Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-charcoal-800 select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-forest-800 focus:ring-forest-700 border-cream-400"
              />
              <span>In-stock only (hide sold out)</span>
            </label>
          </div>

          {/* Innovation Info Card */}
          <div className="p-3.5 rounded-xl bg-forest-50 border border-forest-200 text-forest-900 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-forest-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Explainable Quality</span>
            </div>
            <p className="text-[11px] text-forest-700 leading-relaxed">
              Every seller sets independent prices without middleman inflation. Compare similar breads or fruits directly with our comparison drawer!
            </p>
          </div>
        </aside>

        {/* Products Grid Column */}
        <main className="lg:col-span-9 space-y-6">
          {/* Top Bar: Count & Sorting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-cream-300 shadow-subtle">
            <div className="flex items-center gap-2 text-xs text-charcoal-600">
              <span className="font-bold text-charcoal-900">{products.length}</span>
              <span>local products found</span>
              {hasActiveFilters && (
                <span className="bg-forest-100 text-forest-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Filtered
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile Filter Toggle Button */}
              <button
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                className="lg:hidden flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-cream-200 text-charcoal-800"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs text-charcoal-600">
                <span className="hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-cream-50 border border-cream-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-charcoal-800 focus:outline-none cursor-pointer"
                >
                  <option value="featured">Curated & Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Customer Rating</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-cream-200 animate-pulse"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Useful Empty State */
            <div className="bg-white rounded-3xl border border-cream-300 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-cream-200 text-charcoal-400 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-charcoal-900">No matching products found</h3>
              <p className="text-xs text-charcoal-500 max-w-sm mx-auto leading-relaxed">
                We couldn't find any local products matching your current filters. Try relaxing your price bounds or searching for other items.
              </p>
              <button
                onClick={handleResetFilters}
                className="bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
