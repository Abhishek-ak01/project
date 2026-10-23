import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  Sparkles, 
  Store, 
  ShieldCheck, 
  User, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, switchDemoRole } = useAuth();
  const { addToast } = useToast();

  const [role, setRole] = useState('customer'); // 'customer' | 'seller' | 'admin'
  const [email, setEmail] = useState('elena@example.com');
  const [password, setPassword] = useState('••••••••');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || (role === 'seller' ? '/seller/dashboard' : role === 'admin' ? '/admin' : '/');

  const handleRoleSelect = (newRole) => {
    setRole(newRole);
    if (newRole === 'customer') setEmail('elena@example.com');
    if (newRole === 'seller') setEmail('marcus@crustandcrumb.local');
    if (newRole === 'admin') setEmail('admin@localloop.local');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login({ email, password, role });
      const target = role === 'seller' ? '/seller/dashboard' : role === 'admin' ? '/admin' : '/marketplace';
      navigate(target, { replace: true });
    } catch (err) {
      addToast('Login failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstantDemoLogin = (targetRole) => {
    switchDemoRole(targetRole);
    const target = targetRole === 'seller' ? '/seller/dashboard' : targetRole === 'admin' ? '/admin' : '/marketplace';
    navigate(target);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-forest-900 flex items-center justify-center text-white mx-auto shadow-md">
          <span className="font-serif italic font-bold text-2xl text-emerald-400">L</span>
          <span className="font-serif italic font-bold text-xl text-cream-100 -ml-1">L</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-charcoal-950">
          Welcome to LocalLoop
        </h1>
        <p className="text-xs text-charcoal-500">
          Sign in to your customer, seller, or administration account.
        </p>
      </div>

      {/* Instant Demo Switcher for Hackathon Reviewers */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>One-Click Hackathon Evaluator Login:</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleInstantDemoLogin('customer')}
            className="p-2.5 rounded-xl bg-white text-charcoal-800 border border-emerald-200 text-xs font-semibold hover:border-emerald-500 hover:shadow-sm transition-all text-center"
          >
            <User className="w-4 h-4 mx-auto mb-1 text-forest-700" />
            <span>Shopper</span>
          </button>
          <button
            type="button"
            onClick={() => handleInstantDemoLogin('seller')}
            className="p-2.5 rounded-xl bg-white text-charcoal-800 border border-emerald-200 text-xs font-semibold hover:border-emerald-500 hover:shadow-sm transition-all text-center"
          >
            <Store className="w-4 h-4 mx-auto mb-1 text-forest-700" />
            <span>Seller</span>
          </button>
          <button
            type="button"
            onClick={() => handleInstantDemoLogin('admin')}
            className="p-2.5 rounded-xl bg-white text-charcoal-800 border border-emerald-200 text-xs font-semibold hover:border-emerald-500 hover:shadow-sm transition-all text-center"
          >
            <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-purple-700" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* Main Login Form */}
      <form onSubmit={handleLoginSubmit} className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-elevated space-y-5 text-xs">
        {/* Role Segmented Tabs */}
        <div>
          <label className="font-bold text-charcoal-700 block mb-2">Account Role</label>
          <div className="grid grid-cols-3 gap-1 bg-cream-100 p-1 rounded-2xl border border-cream-300">
            <button
              type="button"
              onClick={() => handleRoleSelect('customer')}
              className={`py-2 rounded-xl font-bold transition-all ${
                role === 'customer' ? 'bg-forest-900 text-white shadow-sm' : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              Shopper
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('seller')}
              className={`py-2 rounded-xl font-bold transition-all ${
                role === 'seller' ? 'bg-forest-900 text-white shadow-sm' : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              Seller
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`py-2 rounded-xl font-bold transition-all ${
                role === 'admin' ? 'bg-forest-900 text-white shadow-sm' : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Email Input */}
        <div>
          <label className="font-bold text-charcoal-800 block mb-1">Email Address</label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl pl-9 pr-3 py-2.5 focus:ring-1 focus:ring-forest-600 focus:outline-none"
            />
            <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="font-bold text-charcoal-800 block mb-1">Password</label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl pl-9 pr-3 py-2.5 focus:ring-1 focus:ring-forest-600 focus:outline-none"
            />
            <Lock className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-forest-900 hover:bg-forest-800 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
        >
          <span>{isSubmitting ? 'Authenticating...' : `Sign In as ${role.toUpperCase()}`}</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
        </button>

        <div className="pt-2 text-center text-charcoal-500">
          <span>Don't have an account yet? </span>
          <Link to="/register" className="font-bold text-forest-800 hover:underline">
            Register here
          </Link>
        </div>
      </form>
    </div>
  );
}
