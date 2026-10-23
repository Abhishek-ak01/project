import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  Heart, 
  Scale, 
  User, 
  Store, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useComparison } from '../../context/ComparisonContext';
import { useFavorites } from '../../context/FavoritesContext';
import { NEIGHBORHOODS } from '../../services/mockData';
import { formatCurrency } from '../../utils/formatters';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, switchDemoRole, logout, isAuthenticated } = useAuth();
  const { totalItems, subtotal, openCart } = useCart();
  const { comparedProducts, openModal: openComparisonModal } = useComparison();
  const { favorites } = useFavorites();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All Neighborhoods');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}&neighborhood=${encodeURIComponent(selectedNeighborhood)}`);
      setIsMobileMenuOpen(false);
    } else {
      navigate(`/marketplace?neighborhood=${encodeURIComponent(selectedNeighborhood)}`);
    }
  };

  const handleNeighborhoodChange = (neigh) => {
    setSelectedNeighborhood(neigh);
    navigate(`/marketplace?neighborhood=${encodeURIComponent(neigh)}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-cream-50/90 backdrop-blur-md border-b border-cream-300">
      {/* Top Banner: Local Support & Persona Switcher */}
      <div className="bg-forest-900 text-forest-100 text-xs px-4 py-1.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              HACKATHON DEMO
            </span>
            <span className="hidden sm:inline">100% of marketplace purchases directly empower local independent businesses.</span>
            <span className="sm:hidden">Local-first community marketplace</span>
          </div>

          {/* Quick Persona Switcher for Hackathon Judges */}
          <div className="relative">
            <button
              onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
              className="flex items-center gap-1.5 bg-forest-800/80 hover:bg-forest-700/80 text-forest-50 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border border-forest-600/40"
              title="Switch demo persona to test Customer, Seller, or Admin permissions"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Persona: <strong>{user?.fullName || 'Guest'}</strong> ({role.toUpperCase()})</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
            </button>

            {isPersonaMenuOpen && (
              <div 
                className="absolute right-0 mt-1.5 w-64 bg-white text-charcoal-900 rounded-xl shadow-xl border border-cream-300 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setIsPersonaMenuOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Test Personas (Instant Switch)
                </div>
                <button
                  onClick={() => { switchDemoRole('customer'); setIsPersonaMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-cream-100 transition-colors ${role === 'customer' ? 'bg-cream-100/80 font-semibold text-forest-900' : ''}`}
                >
                  <div>
                    <div className="font-medium text-gray-900">Elena Rostova</div>
                    <div className="text-[11px] text-gray-500">Local Shopper (Customer)</div>
                  </div>
                  {role === 'customer' && <span className="w-2 h-2 rounded-full bg-emerald-600"></span>}
                </button>
                <button
                  onClick={() => { switchDemoRole('seller'); setIsPersonaMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-cream-100 transition-colors ${role === 'seller' ? 'bg-cream-100/80 font-semibold text-forest-900' : ''}`}
                >
                  <div>
                    <div className="font-medium text-gray-900">Marcus Vance</div>
                    <div className="text-[11px] text-gray-500">Crust & Crumb Bakery (Seller)</div>
                  </div>
                  {role === 'seller' && <span className="w-2 h-2 rounded-full bg-emerald-600"></span>}
                </button>
                <button
                  onClick={() => { switchDemoRole('admin'); setIsPersonaMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-cream-100 transition-colors ${role === 'admin' ? 'bg-cream-100/80 font-semibold text-forest-900' : ''}`}
                >
                  <div>
                    <div className="font-medium text-gray-900">Sarah Jenkins</div>
                    <div className="text-[11px] text-gray-500">Marketplace Lead (Admin)</div>
                  </div>
                  {role === 'admin' && <span className="w-2 h-2 rounded-full bg-emerald-600"></span>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-11 h-11 rounded-2xl bg-forest-900 flex items-center justify-center text-white shadow-md group-hover:bg-forest-800 transition-colors">
              <span className="font-serif italic font-bold text-2xl text-emerald-400">L</span>
              <span className="font-serif italic font-bold text-xl text-cream-100 -ml-1">L</span>
            </div>
            <div>
              <span className="text-xl font-bold font-serif tracking-tight text-forest-950 block leading-none">
                Local<span className="text-forest-600">Loop</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-charcoal-500 block mt-0.5">
                Neighborhood Goods
              </span>
            </div>
          </Link>

          {/* Neighborhood Selector Pill */}
          <div className="hidden lg:flex items-center bg-cream-200/70 border border-cream-300 rounded-full px-3 py-1.5 text-xs text-charcoal-700">
            <MapPin className="w-3.5 h-3.5 text-forest-600 mr-1.5 shrink-0" />
            <select
              value={selectedNeighborhood}
              onChange={(e) => handleNeighborhoodChange(e.target.value)}
              className="bg-transparent font-medium text-charcoal-800 focus:outline-none cursor-pointer pr-1"
            >
              {NEIGHBORHOODS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search sourdough, organic greens, honey, coffee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-cream-300 rounded-full pl-10 pr-10 py-2.5 text-sm text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent transition-all shadow-subtle"
            />
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bg-forest-900 hover:bg-forest-800 text-white rounded-full p-1.5 transition-colors"
              aria-label="Submit Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Navigation Links & Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/marketplace"
              className={`hidden md:inline-flex text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/marketplace' ? 'text-forest-900 bg-cream-200/80 font-semibold' : 'text-charcoal-700 hover:text-forest-900'
              }`}
            >
              Marketplace
            </Link>

            {role === 'seller' ? (
              <Link
                to="/seller/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-forest-100 text-forest-900 hover:bg-forest-200 transition-colors border border-forest-300"
              >
                <Store className="w-3.5 h-3.5 text-forest-700" />
                <span>Seller Hub</span>
              </Link>
            ) : role === 'admin' ? (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-purple-100 text-purple-900 hover:bg-purple-200 transition-colors border border-purple-300"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                <span>Admin Moderation</span>
              </Link>
            ) : (
              <Link
                to="/register?role=seller"
                className="hidden xl:inline-flex items-center gap-1 text-xs font-medium text-forest-700 hover:text-forest-900 px-2 py-1 rounded transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Sell with us</span>
              </Link>
            )}

            {/* Compare Products Button (Innovation) */}
            <button
              onClick={openComparisonModal}
              className="relative p-2.5 rounded-full text-charcoal-700 hover:text-forest-900 hover:bg-cream-200/60 transition-colors"
              title="Compare Local Products"
              aria-label="Compare products"
            >
              <Scale className="w-5 h-5" />
              {comparedProducts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-forest-700 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in">
                  {comparedProducts.length}
                </span>
              )}
            </button>

            {/* Favourites Button */}
            <Link
              to="/marketplace?filter=favorites"
              className="relative p-2.5 rounded-full text-charcoal-700 hover:text-forest-900 hover:bg-cream-200/60 transition-colors"
              title="Saved Favorites"
              aria-label="Saved favorites"
            >
              <Heart className="w-5 h-5" />
              {favorites.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* Cart Slide-Over Trigger Pill */}
            <button
              onClick={openCart}
              className="flex items-center gap-2 bg-forest-900 hover:bg-forest-800 text-white px-3.5 py-2 rounded-full transition-all shadow-md active:scale-95 group"
              aria-label="Open shopping cart"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-emerald-400 group-hover:rotate-6 transition-transform" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-emerald-500 text-forest-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-forest-900">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold hidden sm:inline">
                {formatCurrency(subtotal)}
              </span>
            </button>

            {/* User Account Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-2 rounded-full hover:bg-cream-200/60 text-charcoal-700 transition-colors flex items-center gap-1"
                aria-label="User Account Menu"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.fullName} className="w-8 h-8 rounded-full object-cover border border-cream-400" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-cream-300 flex items-center justify-center text-charcoal-700">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </button>

              {isUserMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-cream-300 py-2 z-50 animate-in fade-in zoom-in-95"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-cream-200">
                    <p className="text-sm font-semibold text-charcoal-900">{user?.fullName || 'Guest'}</p>
                    <p className="text-xs text-charcoal-500 truncate">{user?.email || 'Not logged in'}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-forest-50 text-forest-800 border border-forest-200">
                      {role}
                    </span>
                  </div>

                  <Link
                    to="/orders"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-4 py-2 text-xs text-charcoal-700 hover:bg-cream-100 transition-colors"
                  >
                    My Order History
                  </Link>

                  {role === 'seller' && (
                    <Link
                      to="/seller/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-xs font-semibold text-forest-800 hover:bg-cream-100 transition-colors"
                    >
                      Seller Dashboard
                    </Link>
                  )}

                  {role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-xs font-semibold text-purple-800 hover:bg-cream-100 transition-colors"
                    >
                      Admin Moderation Center
                    </Link>
                  )}

                  <div className="border-t border-cream-200 mt-1 pt-1">
                    {isAuthenticated ? (
                      <button
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-forest-800 hover:bg-cream-100"
                      >
                        Sign In / Register
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 md:hidden text-charcoal-700 hover:text-charcoal-900"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-cream-300 px-4 py-4 space-y-3 animate-in slide-in-from-top duration-200">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search local products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-lg pl-9 pr-4 py-2 text-sm"
            />
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
          </form>

          <div className="flex flex-col space-y-2 pt-2 border-t border-cream-200">
            <Link
              to="/marketplace"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-charcoal-800 py-1.5 hover:text-forest-800"
            >
              Marketplace Catalog
            </Link>
            <Link
              to="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-charcoal-800 py-1.5 hover:text-forest-800"
            >
              My Orders & Status Tracker
            </Link>
            {role === 'seller' && (
              <Link
                to="/seller/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-semibold text-forest-800 py-1.5"
              >
                Seller Dashboard
              </Link>
            )}
            {role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-semibold text-purple-800 py-1.5"
              >
                Admin Moderation
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
