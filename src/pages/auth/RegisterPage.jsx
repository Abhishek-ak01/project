import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  User, 
  Store, 
  MapPin, 
  Mail, 
  Phone, 
  Lock, 
  ArrowRight,
  ShieldCheck,
  Leaf
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NEIGHBORHOODS } from '../../services/mockData';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { registerCustomer, registerSeller } = useAuth();

  const initialRole = searchParams.get('role') === 'seller' ? 'seller' : 'customer';
  const [activeTab, setActiveTab] = useState(initialRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState('Greenville Downtown');
  const [password, setPassword] = useState('');

  // Seller specific fields
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (activeTab === 'customer') {
        await registerCustomer({ fullName, email, phone, neighborhood });
        navigate('/marketplace');
      } else {
        await registerSeller({ fullName, storeName, email, phone, neighborhood, description });
        navigate('/seller/dashboard');
      }
    } catch (err) {
      console.error('Registration failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16 space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-forest-900 flex items-center justify-center text-white mx-auto shadow-md">
          <span className="font-serif italic font-bold text-2xl text-emerald-400">L</span>
          <span className="font-serif italic font-bold text-xl text-cream-100 -ml-1">L</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-charcoal-950">
          Create Your LocalLoop Account
        </h1>
        <p className="text-xs text-charcoal-500">
          Join the neighborhood food revolution as a shopper or local producer.
        </p>
      </div>

      {/* Main Registration Box */}
      <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-elevated space-y-6">
        {/* Account Type Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-cream-100 p-1 rounded-2xl border border-cream-300">
          <button
            type="button"
            onClick={() => setActiveTab('customer')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'customer'
                ? 'bg-forest-900 text-white shadow-sm'
                : 'text-charcoal-700 hover:text-charcoal-950'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Shopper (Buy Local)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seller')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'seller'
                ? 'bg-forest-900 text-white shadow-sm'
                : 'text-charcoal-700 hover:text-charcoal-950'
            }`}
          >
            <Store className="w-4 h-4 text-emerald-400" />
            <span>Local Seller (Open Stall)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {activeTab === 'seller' && (
            <div>
              <label className="font-bold text-charcoal-800 block mb-1">Store / Stall Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Hearth & Heather Micro-Bakery"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-forest-600 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="font-bold text-charcoal-800 block mb-1">
              {activeTab === 'seller' ? 'Head Baker / Grower Full Name' : 'Your Full Name'}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Maya Sterling"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-charcoal-800 block mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-forest-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-charcoal-800 block mb-1">Contact Phone</label>
              <input
                type="tel"
                required
                placeholder="(555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-forest-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-charcoal-800 block mb-1">Neighborhood Area</label>
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-charcoal-800 focus:ring-1 focus:ring-forest-600 focus:outline-none cursor-pointer"
            >
              {NEIGHBORHOODS.filter(n => n !== 'All Neighborhoods').map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {activeTab === 'seller' && (
            <div>
              <label className="font-bold text-charcoal-800 block mb-1">Store Story / Sourcing Standards</label>
              <textarea
                rows="3"
                placeholder="Tell neighbors how you source your grains, handle fermentation, or cultivate your harvest..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-forest-600 focus:outline-none"
              ></textarea>
            </div>
          )}

          <div>
            <label className="font-bold text-charcoal-800 block mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="Create a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-forest-900 hover:bg-forest-800 text-white font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
          >
            <span>{isSubmitting ? 'Registering...' : activeTab === 'seller' ? 'Open Seller Storefront' : 'Create Customer Account'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          <p className="text-[11px] text-center text-charcoal-500 pt-2">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-forest-800 hover:underline">
              Log in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
