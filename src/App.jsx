import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ComparisonProvider } from './context/ComparisonContext';
import { FavoritesProvider } from './context/FavoritesContext';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ToastContainer from './components/common/ToastContainer';
import ProtectedRoute from './components/common/ProtectedRoute';
import CartDrawer from './components/customer/CartDrawer';
import ProductComparisonModal from './components/customer/ProductComparisonModal';

// Pages
import HomePage from './pages/customer/HomePage';
import MarketplacePage from './pages/customer/MarketplacePage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import StorefrontPage from './pages/customer/StorefrontPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderConfirmationPage from './pages/customer/OrderConfirmationPage';
import OrderHistoryPage from './pages/customer/OrderHistoryPage';

import SellerDashboardPage from './pages/seller/SellerDashboardPage';
import SellerProductsPage from './pages/seller/SellerProductsPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <ComparisonProvider>
            <FavoritesProvider>
              <Router>
                <div className="min-h-screen flex flex-col bg-cream-100 text-charcoal-900 font-sans selection:bg-forest-100 selection:text-forest-900">
                  <Navbar />

                  <main className="flex-1">
                    <Routes>
                      {/* Customer Discovery & Shopping */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/marketplace" element={<MarketplacePage />} />
                      <Route path="/product/:id" element={<ProductDetailPage />} />
                      <Route path="/store/:id" element={<StorefrontPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
                      <Route path="/orders" element={<OrderHistoryPage />} />

                      {/* Seller Hub (Protected) */}
                      <Route
                        path="/seller/dashboard"
                        element={
                          <ProtectedRoute allowedRoles={['seller', 'admin']}>
                            <SellerDashboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/seller/products"
                        element={
                          <ProtectedRoute allowedRoles={['seller', 'admin']}>
                            <SellerProductsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/seller/orders"
                        element={
                          <ProtectedRoute allowedRoles={['seller', 'admin']}>
                            <SellerOrdersPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Administrator Moderation (Protected) */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboardPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Authentication */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />

                      {/* Catch-all */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>

                  <Footer />

                  {/* Overlays & Modals */}
                  <CartDrawer />
                  <ProductComparisonModal />
                  <ToastContainer />
                </div>
              </Router>
            </FavoritesProvider>
          </ComparisonProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
