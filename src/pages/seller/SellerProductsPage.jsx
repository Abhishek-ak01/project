import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  ArrowLeft, 
  X, 
  Package,
  Sparkles,
  ExternalLink,
  Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  getProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  getCategories 
} from '../../services/db';
import { formatCurrency } from '../../utils/formatters';

export default function SellerProductsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const sellerId = user?.sellerId || 'seller-1';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    categoryId: 'cat-bakery',
    price: '',
    compareAtPrice: '',
    stockQuantity: '15',
    unit: '850g loaf',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    isOrganic: true,
  });

  const loadSellerProducts = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        getProducts({ sellerId }),
        getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load seller products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerProducts();
  }, [sellerId]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      categoryId: categories[0]?.id || 'cat-bakery',
      price: '',
      compareAtPrice: '',
      stockQuantity: '15',
      unit: 'loaf',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80',
      isOrganic: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      categoryId: product.categoryId,
      price: product.price.toString(),
      compareAtPrice: product.compareAtPrice ? product.compareAtPrice.toString() : '',
      stockQuantity: product.stockQuantity.toString(),
      unit: product.unit,
      description: product.description || '',
      imageUrl: product.images?.[0] || '',
      isOrganic: Boolean(product.isOrganic),
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          title: formData.title,
          categoryId: formData.categoryId,
          price: parseFloat(formData.price),
          compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
          stockQuantity: parseInt(formData.stockQuantity, 10),
          unit: formData.unit,
          description: formData.description,
          images: [formData.imageUrl],
          isOrganic: formData.isOrganic,
        }, sellerId);
        addToast(`Updated "${formData.title}"`, 'success');
      } else {
        await addProduct({
          sellerId,
          title: formData.title,
          categoryId: formData.categoryId,
          price: parseFloat(formData.price),
          compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
          stockQuantity: parseInt(formData.stockQuantity, 10),
          unit: formData.unit,
          description: formData.description,
          images: [formData.imageUrl],
          isOrganic: formData.isOrganic,
          originNeighborhood: user?.neighborhood || 'Eastside Mill District',
        }, sellerId);
        addToast(`Added new product "${formData.title}"!`, 'success');
      }
      setIsModalOpen(false);
      loadSellerProducts();
    } catch (err) {
      addToast(err.message || 'Operation failed', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (productId, title) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from your storefront catalog?`)) {
      try {
        await deleteProduct(productId, sellerId);
        addToast(`Removed "${title}" from catalog`, 'info');
        loadSellerProducts();
      } catch (err) {
        addToast(err.message || 'Failed to remove', 'error');
      }
    }
  };

  const handleQuickRestock = async (product) => {
    try {
      const newQty = product.stockQuantity + 10;
      await updateProduct(product.id, { stockQuantity: newQty }, sellerId);
      addToast(`Restocked ${product.title} (+10 units, total ${newQty})`, 'success');
      loadSellerProducts();
    } catch (err) {
      addToast('Restock failed', 'error');
    }
  };

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-200 pb-5">
        <div>
          <Link
            to="/seller/dashboard"
            className="text-xs font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="font-serif text-3xl font-bold text-charcoal-950">
            Inventory & Product Management
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Maintain live batch counts, adjust prices, and introduce seasonal arrivals.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold px-4 py-2.5 rounded-full transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-cream-300 shadow-subtle">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search your inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-cream-50 border border-cream-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-forest-600 focus:outline-none"
          />
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
        </div>

        <div className="text-xs text-charcoal-500 font-medium">
          Showing <strong>{filtered.length}</strong> provisions listed
        </div>
      </div>

      {/* Product Management Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-cream-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-cream-300 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-cream-200 text-charcoal-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-charcoal-900">No products listed</h3>
          <p className="text-xs text-charcoal-500 max-w-xs mx-auto">
            Get started by adding your first fresh harvest, artisan sourdough, or handcrafted jar.
          </p>
          <button
            onClick={handleOpenAdd}
            className="bg-forest-900 text-white text-xs font-bold px-5 py-2.5 rounded-full"
          >
            Add First Product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-cream-300 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100 text-charcoal-700 font-bold border-b border-cream-300">
                <tr>
                  <th className="py-3.5 px-4">Item</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price / Unit</th>
                  <th className="py-3.5 px-4">Stock Level</th>
                  <th className="py-3.5 px-4">Badges</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {filtered.map((prod) => {
                  const isLow = prod.stockQuantity <= 5;
                  return (
                    <tr key={prod.id} className="hover:bg-cream-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images?.[0]}
                            alt={prod.title}
                            className="w-12 h-12 rounded-xl object-cover border border-cream-300 bg-cream-100 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-charcoal-900 block">{prod.title}</span>
                            <span className="text-[11px] text-charcoal-400">ID: {prod.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-charcoal-600 font-medium">
                        {categories.find(c => c.id === prod.categoryId)?.name || 'Local Goods'}
                      </td>

                      <td className="py-3 px-4 font-bold text-forest-950">
                        {formatCurrency(prod.price)} <span className="text-[10px] font-normal text-charcoal-500">/{prod.unit}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              prod.stockQuantity <= 0
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {prod.stockQuantity} in stock
                          </span>

                          {isLow && (
                            <button
                              onClick={() => handleQuickRestock(prod)}
                              className="text-[10px] font-bold text-forest-700 bg-cream-200 hover:bg-forest-100 px-2 py-0.5 rounded transition-colors"
                              title="Add 10 units immediately"
                            >
                              +10 Quick Restock
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {prod.isOrganic && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Organic
                            </span>
                          )}
                          {prod.badges?.slice(0, 1).map((b, i) => (
                            <span key={i} className="bg-cream-200 text-charcoal-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 rounded-lg text-charcoal-600 hover:text-forest-800 hover:bg-cream-200 transition-colors"
                            title="Edit product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id, prod.title)}
                            className="p-1.5 rounded-lg text-charcoal-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div 
            className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-cream-300 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-cream-300 flex items-center justify-between bg-cream-50">
              <h3 className="font-bold text-charcoal-900 text-sm">
                {editingProduct ? 'Edit Listed Product' : 'Add New Provision to Storefront'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="font-bold text-charcoal-800 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Country Sourdough Loaf"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 focus:ring-1 focus:ring-forest-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-charcoal-800 block mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-charcoal-800 focus:ring-1 focus:ring-forest-600 focus:outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-charcoal-800 block mb-1">Unit Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 850g loaf, 1 kg basket"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 focus:ring-1 focus:ring-forest-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-charcoal-800 block mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    placeholder="7.50"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 focus:ring-1 focus:ring-forest-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-charcoal-800 block mb-1">Compare Price ($)</label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="Optional (9.00)"
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 focus:ring-1 focus:ring-forest-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-charcoal-800 block mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 focus:ring-1 focus:ring-forest-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-charcoal-800 block mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 focus:ring-1 focus:ring-forest-600 focus:outline-none text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-800 block mb-1">Description & Ingredients</label>
                <textarea
                  rows="3"
                  placeholder="Describe your baking technique, organic flour blend, or harvest freshness..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 focus:ring-1 focus:ring-forest-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-charcoal-800">
                  <input
                    type="checkbox"
                    checked={formData.isOrganic}
                    onChange={(e) => setFormData({ ...formData, isOrganic: e.target.checked })}
                    className="w-4 h-4 rounded text-forest-800"
                  />
                  <span>Certified Organic / Zero Pesticides / Wild Ferment</span>
                </label>
              </div>

              <div className="pt-4 border-t border-cream-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-charcoal-600 hover:bg-cream-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-forest-900 hover:bg-forest-800 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
