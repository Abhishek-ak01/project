import { 
  CATEGORIES, 
  NEIGHBORHOODS, 
  INITIAL_SELLERS, 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  DEMO_USERS 
} from './mockData.js';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';

// Authoritative In-Memory Store for Hackathon Sandbox
let sellersStore = [...INITIAL_SELLERS];
let productsStore = [...INITIAL_PRODUCTS];
let ordersStore = [...INITIAL_ORDERS];
let moderationLogs = [];

// Helper to simulate realistic async network latency for authentic UI loading states
const delay = (ms = 120) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * ============================================================================
 * PRODUCTS API
 * ============================================================================
 */
export async function getProducts(filters = {}) {
  await delay(80);

  // If live Supabase connection is active, query Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('products')
        .select('*, seller_profiles(*), categories(*)')
        .eq('is_active', true)
        .eq('is_moderated', false);

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category_id', filters.category);
      }
      if (filters.sellerId) {
        query = query.eq('seller_id', filters.sellerId);
      }
      if (filters.inStockOnly) {
        query = query.gt('stock_quantity', 0);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.map(p => ({
          ...p,
          id: p.id,
          title: p.name || p.title,
          name: p.name || p.title,
          price: parseFloat(p.price),
          stockQuantity: p.stock_quantity ?? p.stockQuantity,
          sellerId: p.seller_id,
          sellerName: p.seller_profiles?.business_name || 'Local Artisan',
          sellerSlug: p.seller_profiles?.slug || '',
          sellerNeighborhood: p.seller_profiles?.locality || p.originNeighborhood,
          originNeighborhood: p.seller_profiles?.locality || p.originNeighborhood,
        }));
      }
    } catch (e) {
      console.warn('Live Supabase query fell back to local adapter:', e);
    }
  }

  let result = [...productsStore];

  // Filter active and unmoderated
  result = result.filter(p => p.isAvailable !== false && p.isModerated !== true);

  if (filters.category && filters.category !== 'all') {
    result = result.filter(p => p.categoryId === filters.category || p.slug === filters.category);
  }

  if (filters.neighborhood && filters.neighborhood !== 'All Neighborhoods') {
    result = result.filter(p => p.originNeighborhood === filters.neighborhood);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(p => 
      (p.title && p.title.toLowerCase().includes(q)) || 
      (p.name && p.name.toLowerCase().includes(q)) || 
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.badges && p.badges.some(b => b.toLowerCase().includes(q)))
    );
  }

  if (filters.minPrice !== undefined && filters.minPrice !== '') {
    result = result.filter(p => p.price >= Number(filters.minPrice));
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
    result = result.filter(p => p.price <= Number(filters.maxPrice));
  }

  if (filters.inStockOnly) {
    result = result.filter(p => p.stockQuantity > 0);
  }

  if (filters.sellerId) {
    result = result.filter(p => p.sellerId === filters.sellerId);
  }

  // Sorting
  if (filters.sortBy === 'price-low') {
    result.sort((a, b) => a.price - b.price);
  } else if (filters.sortBy === 'price-high') {
    result.sort((a, b) => b.price - a.price);
  } else if (filters.sortBy === 'rating') {
    result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else {
    // Featured default
    result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }

  return result.map(prod => {
    const seller = sellersStore.find(s => s.id === prod.sellerId);
    return {
      ...prod,
      title: prod.title || prod.name,
      name: prod.name || prod.title,
      sellerName: seller ? (seller.business_name || seller.storeName) : 'Local Artisan',
      sellerSlug: seller ? seller.slug : '',
      sellerNeighborhood: seller ? (seller.locality || seller.neighborhood) : prod.originNeighborhood,
      originNeighborhood: seller ? (seller.locality || seller.neighborhood) : prod.originNeighborhood,
    };
  });
}

export async function getProductById(id) {
  await delay(80);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, seller_profiles(*), categories(*)')
        .eq('id', id)
        .single();

      if (!error && data) {
        return {
          ...data,
          title: data.name,
          name: data.name,
          price: parseFloat(data.price),
          stockQuantity: data.stock_quantity,
          seller: {
            ...data.seller_profiles,
            storeName: data.seller_profiles.business_name,
            neighborhood: data.seller_profiles.locality,
          },
          categoryName: data.categories?.name || 'Local Goods',
        };
      }
    } catch (e) {
      console.warn('Falling back to local data adapter:', e);
    }
  }

  const prod = productsStore.find(p => p.id === id || p.slug === id);
  if (!prod) return null;

  const seller = sellersStore.find(s => s.id === prod.sellerId);
  const category = CATEGORIES.find(c => c.id === prod.categoryId);

  return {
    ...prod,
    title: prod.title || prod.name,
    name: prod.name || prod.title,
    seller: seller ? {
      ...seller,
      storeName: seller.business_name || seller.storeName,
      neighborhood: seller.locality || seller.neighborhood,
    } : null,
    categoryName: category ? category.name : 'Local Goods',
  };
}

export async function getSimilarProducts(productId, limit = 4) {
  await delay(60);
  const target = productsStore.find(p => p.id === productId);
  if (!target) return [];

  return productsStore
    .filter(p => p.id !== productId && p.isAvailable !== false && (p.categoryId === target.categoryId || p.sellerId === target.sellerId))
    .slice(0, limit)
    .map(p => {
      const seller = sellersStore.find(s => s.id === p.sellerId);
      return {
        ...p,
        title: p.title || p.name,
        name: p.name || p.title,
        sellerName: seller ? (seller.business_name || seller.storeName) : 'Local Artisan',
      };
    });
}

export async function getCategories() {
  return CATEGORIES;
}

export async function getNeighborhoods() {
  return NEIGHBORHOODS;
}

/**
 * ============================================================================
 * SELLERS API
 * ============================================================================
 */
export async function getSellers() {
  await delay(80);
  return sellersStore.map(s => ({
    ...s,
    storeName: s.business_name || s.storeName,
    neighborhood: s.locality || s.neighborhood,
  }));
}

export async function getSellerById(id) {
  await delay(80);
  const seller = sellersStore.find(s => s.id === id || s.slug === id);
  if (!seller) return null;

  const products = productsStore.filter(p => p.sellerId === seller.id && p.isAvailable !== false);
  return {
    ...seller,
    storeName: seller.business_name || seller.storeName,
    neighborhood: seller.locality || seller.neighborhood,
    products: products.map(p => ({
      ...p,
      title: p.title || p.name,
      name: p.name || p.title,
    })),
  };
}

/**
 * ============================================================================
 * ORDERS & CHECKOUT API (Strict Authoritative Server Validation)
 * ============================================================================
 */
export async function createOrder({
  customerId,
  customerName,
  customerEmail,
  customerPhone,
  deliveryType,
  deliveryAddress,
  paymentMethod,
  cartItems,
  notes = '',
}) {
  await delay(200);

  // Authentication requirement check
  if (!customerId) {
    throw new Error('Authentication required: You must be signed in to place an order.');
  }

  if (!cartItems || cartItems.length === 0) {
    throw new Error('Your cart is empty. Please add items before placing an order.');
  }

  // 1. Authoritative Validation of Quantities, Prices & Stock
  let calculatedSubtotal = 0;
  const verifiedItems = [];
  const sellerCounts = {};

  for (const item of cartItems) {
    // Validate quantity is a positive whole number
    if (!item.quantity || item.quantity <= 0 || !Number.isInteger(Number(item.quantity))) {
      throw new Error(`Invalid quantity "${item.quantity}". Quantity must be a positive whole number.`);
    }

    const qty = parseInt(item.quantity, 10);
    const product = productsStore.find(p => p.id === item.productId);

    if (!product) {
      throw new Error(`Product with ID "${item.productId}" was not found.`);
    }

    if (product.isAvailable === false || product.isModerated === true) {
      throw new Error(`Product "${product.title || product.name}" is no longer available.`);
    }

    if (product.price <= 0) {
      throw new Error(`Product "${product.title || product.name}" has an invalid non-positive price.`);
    }

    // Check inventory availability
    if (product.stockQuantity < qty) {
      throw new Error(
        `Insufficient stock for "${product.title || product.name}". Requested: ${qty}, Available: ${product.stockQuantity}`
      );
    }

    // Authoritative math: ignore any client-supplied totals!
    const lineTotal = Number((product.price * qty).toFixed(2));
    calculatedSubtotal += lineTotal;

    sellerCounts[product.sellerId] = (sellerCounts[product.sellerId] || 0) + 1;

    verifiedItems.push({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      productTitle: product.title || product.name,
      productNameSnapshot: product.title || product.name,
      unitPrice: product.price,
      unitPriceSnapshot: product.price,
      quantity: qty,
      subtotal: lineTotal,
      lineTotal: lineTotal,
      image: product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      sellerId: product.sellerId,
    });
  }

  // Duplicate submission guard (prevents rapid double-clicks within 3 seconds with identical cart)
  const recentDuplicate = ordersStore.find(
    o => o.customerId === customerId &&
         (Date.now() - new Date(o.createdAt).getTime()) < 3000 &&
         JSON.stringify(o.items.map(i => ({ id: i.productId, q: i.quantity }))) === 
         JSON.stringify(cartItems.map(i => ({ id: i.productId, q: parseInt(i.quantity, 10) })))
  );
  if (recentDuplicate) {
    throw new Error('Duplicate order submission detected. Your order is already being processed.');
  }

  const resolvedSellerId = Object.keys(sellerCounts)[0] || 'seller-1';
  const seller = sellersStore.find(s => s.id === resolvedSellerId);

  // 2. Authoritative Fees Computation
  calculatedSubtotal = Number(calculatedSubtotal.toFixed(2));
  const tax = Number((calculatedSubtotal * 0.08).toFixed(2));
  const deliveryFee = (deliveryType === 'pickup' || calculatedSubtotal >= 35.00) ? 0.00 : 3.50;
  const totalAmount = Number((calculatedSubtotal + tax + deliveryFee).toFixed(2));

  // 3. Concurrency-Safe Atomic Stock Decrement
  for (const item of verifiedItems) {
    const prodIndex = productsStore.findIndex(p => p.id === item.productId);
    if (prodIndex !== -1) {
      productsStore[prodIndex] = {
        ...productsStore[prodIndex],
        stockQuantity: productsStore[prodIndex].stockQuantity - item.quantity,
      };
    }
  }

  // 4. Create and persist Order
  const orderNumber = `LL-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const newOrder = {
    id: `ord-${Date.now()}`,
    orderNumber,
    customerId,
    customerName: customerName || 'Elena Rostova',
    customerEmail: customerEmail || 'customer@example.com',
    customerPhone: customerPhone || '(555) 000-0000',
    sellerId: resolvedSellerId,
    sellerName: seller ? (seller.business_name || seller.storeName) : 'Local Maker Collective',
    status: 'placed',
    orderStatus: 'placed',
    subtotal: calculatedSubtotal,
    tax,
    deliveryFee,
    totalAmount,
    total: totalAmount,
    paymentStatus: 'simulated_paid',
    paymentMethod: paymentMethod || 'card_demo',
    deliveryType,
    deliveryAddress,
    notes,
    items: verifiedItems,
    timeline: [
      { status: 'placed', time: now, note: 'Order placed by customer and payment verified (demo).' }
    ],
    createdAt: now,
    updatedAt: now,
  };

  ordersStore.unshift(newOrder);
  return newOrder;
}

export async function getCustomerOrders(customerId) {
  await delay(80);
  if (!customerId) return [];
  return ordersStore.filter(o => o.customerId === customerId);
}

export async function getOrderById(orderId, requesterId = null, requesterRole = null) {
  await delay(80);
  const order = ordersStore.find(o => o.id === orderId || o.orderNumber === orderId);
  if (!order) return null;

  // Security authorization check
  if (requesterId && requesterRole) {
    if (requesterRole === 'customer' && order.customerId !== requesterId) {
      throw new Error('Unauthorized: You do not have permission to view another customer’s order.');
    }
    if (requesterRole === 'seller' && order.sellerId !== requesterId) {
      const hasItem = order.items.some(i => i.sellerId === requesterId);
      if (!hasItem) {
        throw new Error('Unauthorized: You do not have permission to view another seller’s order.');
      }
    }
  }

  return order;
}

/**
 * ============================================================================
 * SELLER ORDER & INVENTORY MANAGEMENT (Permitted Status Transitions)
 * ============================================================================
 */
const PERMITTED_TRANSITIONS = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

export async function updateOrderStatus(orderId, newStatus, sellerId, note = '') {
  await delay(120);
  const orderIndex = ordersStore.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    throw new Error('Order not found.');
  }

  const currentOrder = ordersStore[orderIndex];

  // Enforce cross-seller isolation: sellers can only update their own orders
  if (sellerId && currentOrder.sellerId !== sellerId) {
    const hasItem = currentOrder.items.some(i => i.sellerId === sellerId);
    if (!hasItem && currentOrder.sellerId !== sellerId) {
      throw new Error('Unauthorized: You can only update orders belonging to your own storefront.');
    }
  }

  const allowedNext = PERMITTED_TRANSITIONS[currentOrder.status] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new Error(
      `Invalid transition: Cannot move status from "${currentOrder.status}" to "${newStatus}". Allowed: ${allowedNext.join(', ') || 'none'}`
    );
  }

  // Stock restoration upon cancellation
  if (newStatus === 'cancelled' && currentOrder.status !== 'cancelled') {
    for (const item of currentOrder.items) {
      const prodIndex = productsStore.findIndex(p => p.id === item.productId);
      if (prodIndex !== -1) {
        productsStore[prodIndex] = {
          ...productsStore[prodIndex],
          stockQuantity: productsStore[prodIndex].stockQuantity + item.quantity,
        };
      }
    }
  }

  const now = new Date().toISOString();
  const defaultNotes = {
    confirmed: 'Seller accepted and confirmed the order.',
    preparing: 'Order is being prepared and packed fresh.',
    ready: currentOrder.deliveryType === 'pickup' ? 'Ready for customer pickup at counter.' : 'Out for neighborhood delivery.',
    completed: 'Order successfully delivered / picked up.',
    cancelled: note || 'Order was cancelled.',
  };

  const updatedOrder = {
    ...currentOrder,
    status: newStatus,
    orderStatus: newStatus,
    updatedAt: now,
    timeline: [
      ...currentOrder.timeline,
      { status: newStatus, time: now, note: note || defaultNotes[newStatus] || 'Status updated.' },
    ],
  };

  ordersStore[orderIndex] = updatedOrder;
  return updatedOrder;
}

export async function getSellerOrders(sellerId) {
  await delay(80);
  if (!sellerId) return [];
  // Strictly filter orders belonging to this seller
  return ordersStore.filter(o => o.sellerId === sellerId || o.items.some(i => i.sellerId === sellerId));
}

export async function addProduct(productPayload, sellerId = null) {
  await delay(120);

  if (!productPayload.title || !productPayload.price || productPayload.stockQuantity === undefined) {
    throw new Error('Please fill in title, price, and stock quantity.');
  }

  if (parseFloat(productPayload.price) <= 0) {
    throw new Error('Price must be greater than zero.');
  }

  if (parseInt(productPayload.stockQuantity, 10) < 0) {
    throw new Error('Stock quantity cannot be negative.');
  }

  const effectiveSellerId = sellerId || productPayload.sellerId || 'seller-1';
  const id = `prod-${Date.now()}`;
  const slug = productPayload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const newProduct = {
    id,
    slug,
    sellerId: effectiveSellerId,
    categoryId: productPayload.categoryId || 'cat-produce',
    title: productPayload.title.trim(),
    name: productPayload.title.trim(),
    description: productPayload.description ? productPayload.description.trim() : 'Locally produced with care.',
    price: parseFloat(productPayload.price),
    compareAtPrice: productPayload.compareAtPrice ? parseFloat(productPayload.compareAtPrice) : null,
    stockQuantity: parseInt(productPayload.stockQuantity, 10),
    unit: productPayload.unit || 'unit',
    images: productPayload.images && productPayload.images.length > 0 
      ? productPayload.images 
      : ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'],
    rating: 5.0,
    reviewCount: 0,
    isAvailable: true,
    isFeatured: Boolean(productPayload.isFeatured),
    isOrganic: Boolean(productPayload.isOrganic),
    badges: productPayload.badges || ['New Arrival'],
    originNeighborhood: productPayload.originNeighborhood || 'Eastside Mill District',
    shelfLife: productPayload.shelfLife || 'Fresh daily',
    dietary: productPayload.dietary || [],
    createdAt: new Date().toISOString(),
  };

  productsStore.unshift(newProduct);
  return newProduct;
}

export async function updateProduct(productId, updates, sellerId = null) {
  await delay(120);
  const index = productsStore.findIndex(p => p.id === productId);
  if (index === -1) {
    throw new Error('Product not found.');
  }

  // Cross-seller modification protection
  if (sellerId && productsStore[index].sellerId !== sellerId) {
    throw new Error('Unauthorized: You cannot edit products belonging to another seller.');
  }

  if (updates.price !== undefined && parseFloat(updates.price) <= 0) {
    throw new Error('Price must be greater than zero.');
  }

  if (updates.stockQuantity !== undefined && parseInt(updates.stockQuantity, 10) < 0) {
    throw new Error('Stock quantity cannot be negative.');
  }

  const updated = {
    ...productsStore[index],
    ...updates,
    title: updates.title || productsStore[index].title,
    name: updates.title || productsStore[index].name,
    price: updates.price !== undefined ? parseFloat(updates.price) : productsStore[index].price,
    stockQuantity: updates.stockQuantity !== undefined ? parseInt(updates.stockQuantity, 10) : productsStore[index].stockQuantity,
    updatedAt: new Date().toISOString(),
  };

  productsStore[index] = updated;
  return updated;
}

export async function deleteProduct(productId, sellerId = null) {
  await delay(100);
  const index = productsStore.findIndex(p => p.id === productId);
  if (index === -1) {
    throw new Error('Product not found.');
  }

  // Cross-seller deletion protection
  if (sellerId && productsStore[index].sellerId !== sellerId) {
    throw new Error('Unauthorized: You cannot delete products belonging to another seller.');
  }

  // Soft delete / hide product
  productsStore[index].isAvailable = false;
  return { success: true };
}

/**
 * ============================================================================
 * SELLER ANALYTICS API (Computed from Real Stored Orders & Inventory)
 * ============================================================================
 */
export async function getSellerAnalytics(sellerId = 'seller-1') {
  await delay(80);

  // Strictly filter data for the requested seller
  const sellerOrders = ordersStore.filter(o => o.sellerId === sellerId);
  const sellerProducts = productsStore.filter(p => p.sellerId === sellerId && p.isAvailable !== false);

  const validOrders = sellerOrders.filter(o => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const totalOrdersCount = sellerOrders.length;
  const averageOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

  const lowStockProducts = sellerProducts.filter(p => p.stockQuantity < 5);

  const productSalesMap = {};
  for (const order of validOrders) {
    for (const item of order.items) {
      if (item.sellerId === sellerId || !item.sellerId) {
        productSalesMap[item.productId] = (productSalesMap[item.productId] || 0) + item.quantity;
      }
    }
  }

  const topSelling = sellerProducts
    .map(p => ({
      ...p,
      unitsSold: productSalesMap[p.id] || 0,
      totalEarned: Number(((productSalesMap[p.id] || 0) * p.price).toFixed(2)),
    }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const revenueChartData = days.map((day, idx) => ({
    name: day,
    revenue: Math.round(45 + Math.sin(idx) * 25 + (idx * 14)),
    orders: Math.floor(2 + (idx * 0.8)),
  }));

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalOrdersCount,
    averageOrderValue: Number(averageOrderValue.toFixed(2)),
    activeProductsCount: sellerProducts.length,
    lowStockProducts,
    topSelling,
    revenueChartData,
  };
}

/**
 * ============================================================================
 * ADMIN MODERATION & MARKETPLACE STATS
 * ============================================================================
 */
export async function getAdminMarketplaceStats() {
  await delay(80);
  const totalGMV = ordersStore
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return {
    totalGMV: Number(totalGMV.toFixed(2)),
    totalOrders: ordersStore.length,
    totalSellers: sellersStore.length,
    totalProducts: productsStore.length,
    flaggedListingsCount: productsStore.filter(p => p.isModerated === true).length,
    sellers: sellersStore,
    recentOrders: ordersStore.slice(0, 6),
    moderationLogs,
  };
}

export async function moderateProduct(productId, action, reason = '') {
  await delay(100);
  const prodIndex = productsStore.findIndex(p => p.id === productId);
  if (prodIndex === -1) throw new Error('Product not found.');

  if (action === 'flag') {
    productsStore[prodIndex].isModerated = true;
    productsStore[prodIndex].moderationReason = reason || 'Flagged for review by Administrator';
  } else if (action === 'approve') {
    productsStore[prodIndex].isModerated = false;
    delete productsStore[prodIndex].moderationReason;
  } else if (action === 'remove') {
    productsStore[prodIndex].isAvailable = false;
    productsStore[prodIndex].isModerated = true;
  }

  moderationLogs.unshift({
    id: `mod-${Date.now()}`,
    targetType: 'product',
    targetId: productId,
    targetName: productsStore[prodIndex].title || productsStore[prodIndex].name,
    action,
    reason,
    timestamp: new Date().toISOString(),
  });

  return productsStore[prodIndex];
}

export async function toggleSellerVerification(sellerId) {
  await delay(100);
  const seller = sellersStore.find(s => s.id === sellerId);
  if (!seller) throw new Error('Seller not found.');

  seller.isVerified = !seller.isVerified;

  moderationLogs.unshift({
    id: `mod-${Date.now()}`,
    targetType: 'seller',
    targetId: sellerId,
    targetName: seller.business_name || seller.storeName,
    action: seller.isVerified ? 'verified' : 'unverified',
    reason: `Seller verification status toggled to ${seller.isVerified}`,
    timestamp: new Date().toISOString(),
  });

  return seller;
}

/**
 * ============================================================================
 * PROFILES & AUTHORIZATION VALIDATION
 * ============================================================================
 */
let profilesStore = Object.values(DEMO_USERS).map(u => ({
  id: u.id,
  email: u.email,
  fullName: u.fullName,
  phone: u.phone,
  role: u.role,
  neighborhood: u.neighborhood,
  sellerId: u.sellerId || null,
}));

export async function getUserProfile(targetUserId, requestingUser) {
  await delay(40);
  if (!requestingUser || !requestingUser.id) {
    throw new Error('Authentication required: You must be logged in to view profile details.');
  }

  // Cross-user access check (RLS parity: only owner or administrator)
  if (requestingUser.id !== targetUserId && requestingUser.role !== 'admin') {
    throw new Error('Access denied: You cannot view another user’s private profile.');
  }

  const profile = profilesStore.find(p => p.id === targetUserId);
  if (!profile) throw new Error('User profile not found.');
  return profile;
}

export async function updateUserProfile(targetUserId, updates, requestingUser) {
  await delay(40);
  if (!requestingUser || !requestingUser.id) {
    throw new Error('Authentication required: You must be logged in to modify a profile.');
  }

  // Unauthorized modification check
  if (requestingUser.id !== targetUserId && requestingUser.role !== 'admin') {
    throw new Error('Access denied: You cannot modify another user’s profile.');
  }

  const index = profilesStore.findIndex(p => p.id === targetUserId);
  if (index === -1) throw new Error('User profile not found.');

  // Privilege escalation check (prevent user from changing their own role to admin)
  if (updates.role && updates.role !== profilesStore[index].role && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized role escalation: only an administrator can change account roles.');
  }

  profilesStore[index] = {
    ...profilesStore[index],
    ...updates,
    id: targetUserId, // ID is immutable
    updatedAt: new Date().toISOString(),
  };

  return profilesStore[index];
}

export function validateSession(user) {
  if (!user || !user.id) {
    throw new Error('Session unauthenticated: Access to private area denied.');
  }
  if (user.expiresAt && Date.now() > user.expiresAt) {
    throw new Error('Session expired: Please sign in again.');
  }
  return true;
}

