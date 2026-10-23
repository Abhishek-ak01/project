import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, CheckCircle2, ShieldCheck, HeartHandshake, Leaf, ArrowRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function Footer() {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      addToast('Please enter a valid email address.', 'warning');
      return;
    }
    setSubscribed(true);
    addToast('Thank you for subscribing to neighborhood harvest updates!', 'success');
  };

  return (
    <footer className="bg-forest-950 text-forest-100 pt-16 pb-12 border-t border-forest-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 border-b border-forest-800/80">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-forest-900 flex items-center justify-center text-emerald-400 shrink-0 border border-forest-700/40">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-base">100% Local & Authentic</h4>
              <p className="text-xs text-forest-300 mt-1 leading-relaxed">
                Every loaf, harvest bunch, and jar is produced within 25 miles by verified independent artisans.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-forest-900 flex items-center justify-center text-emerald-400 shrink-0 border border-forest-700/40">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-base">Zero Hidden Commissions</h4>
              <p className="text-xs text-forest-300 mt-1 leading-relaxed">
                Fair transparent pricing where makers keep the fruits of their labor without exploitative fees.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-forest-900 flex items-center justify-center text-emerald-400 shrink-0 border border-forest-700/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-base">Community Verified</h4>
              <p className="text-xs text-forest-300 mt-1 leading-relaxed">
                Rigorous quality standards, transparent ingredient sourcing, and neighborhood accountability.
              </p>
            </div>
          </div>
        </div>

        {/* Links & Newsletter Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 py-12">
          {/* Brand info */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-forest-800 flex items-center justify-center text-white border border-forest-600">
                <span className="font-serif italic font-bold text-xl text-emerald-400">L</span>
                <span className="font-serif italic font-bold text-lg text-cream-100 -ml-1">L</span>
              </div>
              <div>
                <span className="text-xl font-bold font-serif text-white block leading-none">
                  Local<span className="text-emerald-400">Loop</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-forest-300 block mt-0.5">
                  Neighborhood Marketplace
                </span>
              </div>
            </Link>
            <p className="text-xs text-forest-300 leading-relaxed max-w-sm">
              Empowering neighborhood bakeries, urban organic farms, and small-batch artisans to thrive directly alongside conscious local shoppers.
            </p>
            <div className="pt-2 text-xs text-forest-400">
              <span>Built for college hackathon practice • October 2026</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="lg:col-span-2 col-span-6 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Marketplace</h5>
            <ul className="space-y-2 text-xs text-forest-300">
              <li><Link to="/marketplace?category=cat-produce" className="hover:text-white transition-colors">Fresh Harvest</Link></li>
              <li><Link to="/marketplace?category=cat-bakery" className="hover:text-white transition-colors">Artisan Sourdough</Link></li>
              <li><Link to="/marketplace?category=cat-dairy" className="hover:text-white transition-colors">Pasture Dairy & Eggs</Link></li>
              <li><Link to="/marketplace?category=cat-pantry" className="hover:text-white transition-colors">Raw Honey & Pantry</Link></li>
              <li><Link to="/marketplace?category=cat-beverages" className="hover:text-white transition-colors">Craft Micro-Roasters</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2 col-span-6 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400">For Makers</h5>
            <ul className="space-y-2 text-xs text-forest-300">
              <li><Link to="/register?role=seller" className="hover:text-white transition-colors">Open Storefront</Link></li>
              <li><Link to="/seller/dashboard" className="hover:text-white transition-colors">Seller Dashboard</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Seller Portal Sign In</Link></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Seller FAQ</a></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Moderation Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="lg:col-span-4 space-y-3 bg-forest-900/60 p-6 rounded-2xl border border-forest-800">
            <h5 className="text-sm font-semibold text-white">The Weekly Harvest Dispatch</h5>
            <p className="text-xs text-forest-300">
              Receive Thursday morning updates on fresh produce drops, seasonal fruit arrivals, and bakery specials.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium py-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>You're subscribed! Welcome to the loop.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-forest-950 border border-forest-700 rounded-xl px-3 py-2 text-xs text-white placeholder-forest-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-1"
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-forest-950 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-forest-900 flex flex-col sm:flex-row items-center justify-between text-xs text-forest-400 gap-4">
          <p>© 2026 LocalLoop Marketplace. All rights reserved. Open-source hackathon prototype.</p>
          <div className="flex gap-6">
            <span className="hover:text-white transition-colors cursor-pointer">Community Standards</span>
            <span className="hover:text-white transition-colors cursor-pointer">Privacy & Local Data</span>
            <span className="hover:text-white transition-colors cursor-pointer">Simulated Payments Notice</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
