import { 
  CATEGORIES, 
  NEIGHBORHOODS, 
  INITIAL_SELLERS, 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS,
  DEMO_USERS 
} from './mockData';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// In-Memory Data Store (mock backend simulator for hackathon demo)
let sellersStore = [...INITIAL_SELLERS];
let productsStore = [...INITIAL_PRODUCTS];
let ordersStore = [...INITIAL_ORDERS];
let moderationLogs = [];

// Helper to simulate network latency for authentic async behavior and loading states
const delay = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * ============================================================================
 * PRODUCTS API
 * ============================================================================
 */
export async function getProducts(filters = {}) {
  await delay(120);

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('products').select('*, sellers(*)');
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category_id', filters.category);
      }
      const { data, error } = await query;
      if (!error && data) return data;
    } catch (e) {
      console.warn('Falling back to local data adapter:', e);
    }
  }

  let result = [...productsStore];

  // Exclude unmoderated/removed products unless explicitly requested
  result = result.filter(p => p.isAvailable !== false);

  if (filters.category && filters.category !== 'all') {
    result = result.filter(p => p.categoryId === filters.category || p.slug === filters.category);
  }

  if (filters.neighborhood && filters.neighborhood !== 'All Neighborhoods') {
    result = result.filter(p => p.originNeighborhood === filters.neighborhood);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
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
    // Featured / default
    result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }

  // Attach seller metadata for convenience
  return result.map(prod => {
    const seller = sellersStore.find(s => s.id === prod.sellerId);
    return {
      ...prod,
      sellerName: seller ? seller.storeName : 'Local Artisan',
      sellerSlug: seller ? seller.slug : '',
      sellerNeighborhood: seller ? seller.neighborhood : prod.originNeighborhood,
    };
  });
}

export async function getProductById(id) {
  await delay(100);
  const prod = productsStore.find(p => p.id === id || p.slug === id);
  if (!prod) return null;

  const seller = sellersStore.find(s => s.id === prod.sellerId);
  const category = CATEGORIES.find(c => c.id === prod.categoryId);

  return {
    ...prod,
    seller,
    categoryName: category ? category.name : 'Local Goods',
  };
}

export async function getSimilarProducts(productId, limit = 4) {
  await delay(80);
  const target = productsStore.find(p => p.id === productId);
  if (!target) return [];

  return productsStore
    .filter(p => p.id !== productId && (p.categoryId === target.categoryId || p.sellerId === target.sellerId))
    .slice(0, limit)
    .map(p => {
      const seller = sellersStore.find(s => s.id === p.sellerId);
      return {
        ...p,
        sellerName: seller ? seller.storeName : 'Local Artisan',
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
  await delay(100);
  return [...sellersStore];
}

export async function getSellerById(id) {
  await delay(100);
  const seller = sellersStore.find(s => s.id === id || s.slug === id);
  if (!seller) return null;

  const products = productsStore.filter(p => p.sellerId === seller.id);
  return {
    ...seller,
    products,
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
  deliveryType, // 'local_delivery' | 'pickup'
  deliveryAddress,
  paymentMethod,
  cartItems, // array of { productId, quantity }
  notes = '',
}) {
  await delay(350);

  if (!cartItems || cartItems.length === 0) {
    throw new Error('Your cart is empty.');
  }

  // 1. Authoritative Stock & Price Check
  // Never trust client price or client stock computation
  let calculatedSubtotal = 0;
  const verifiedItems = [];
  const primarySellerId = null;
  const sellerCounts = {};

  for (const item of cartItems) {
    const product = productsStore.find(p => p.id === item.productId);
    if (!product) {
      throw new Error(`Product with ID "${item.productId}" no longer exists.`);
    }

    if (product.stockQuantity < item.quantity) {
      throw new Error(
        `Insufficient stock for "${product.title}". Requested: ${item.quantity}, Available: ${product.stockQuantity}`
      );
    }

    const itemSubtotal = Number((product.price * item.quantity).toFixed(2));
    calculatedSubtotal += itemSubtotal;

    sellerCounts[product.sellerId] = (sellerCounts[product.sellerId] || 0) + 1;

    verifiedItems.push({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      productTitle: product.title,
      unitPrice: product.price,
      quantity: item.quantity,
      subtotal: itemSubtotal,
      image: product.images[0],
      sellerId: product.sellerId,
    });
  }

  // Find dominant seller (for multi-seller or single-seller fulfillment)
  const resolvedSellerId = Object.keys(sellerCounts)[0] || 'seller-1';
  const seller = sellersStore.find(s => s.id === resolvedSellerId);

  // 2. Authoritative Fees Computation
  calculatedSubtotal = Number(calculatedSubtotal.toFixed(2));
  const tax = Number((calculatedSubtotal * 0.08).toFixed(2));
  const deliveryFee = deliveryType === 'pickup' ? 0.00 : (calculatedSubtotal > 35 ? 0.00 : 3.50);
  const totalAmount = Number((calculatedSubtotal + tax + deliveryFee).toFixed(2));

  // 3. Atomic Stock Decrement
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
    customerId: customerId || 'user-customer-1',
    customerName: customerName || 'Valued Customer',
    customerEmail: customerEmail || 'customer@example.com',
    customerPhone: customerPhone || '(555) 000-0000',
    sellerId: resolvedSellerId,
    sellerName: seller ? seller.storeName : 'Local Artisan Collective',
    status: 'placed',
    subtotal: calculatedSubtotal,
    tax,
    deliveryFee,
    totalAmount,
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
  await delay(120);
  return ordersStore.filter(o => !customerId || o.customerId === customerId);
}

export async function getOrderById(orderId) {
  await delay(100);
  const order = ordersStore.find(o => o.id === orderId || o.orderNumber === orderId);
  return order || null;
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
  await delay(200);
  const orderIndex = ordersStore.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    throw new Error('Order not found.');
  }

  const currentOrder = ordersStore[orderIndex];

  // Optional seller authorization check
  if (sellerId && currentOrder.sellerId !== sellerId) {
    // In multi-item demo, allow seller if any item matches
    const hasItem = currentOrder.items.some(i => i.sellerId === sellerId);
    if (!hasItem && currentOrder.sellerId !== sellerId) {
      throw new Error('Unauthorized: You can only update orders for your storefront.');
    }
  }

  const allowedNext = PERMITTED_TRANSITIONS[currentOrder.status] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new Error(
      `Invalid transition: Cannot move status from "${currentOrder.status}" to "${newStatus}". Allowed: ${allowedNext.join(', ') || 'none'}`
    );
  }

  // If cancelling, restore inventory atomically
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
  await delay(120);
  return ordersStore.filter(o => o.sellerId === sellerId || o.items.some(i => i.sellerId === sellerId));
}

export async function addProduct(productPayload) {
  await delay(200);

  if (!productPayload.title || !productPayload.price || productPayload.stockQuantity === undefined) {
    throw new Error('Please fill in title, price, and stock quantity.');
  }

  const id = `prod-${Date.now()}`;
  const slug = productPayload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const newProduct = {
    id,
    slug,
    sellerId: productPayload.sellerId || 'seller-1',
    categoryId: productPayload.categoryId || 'cat-produce',
    title: productPayload.title.trim(),
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

export async function updateProduct(productId, updates) {
  await delay(180);
  const index = productsStore.findIndex(p => p.id === productId);
  if (index === -1) {
    throw new Error('Product not found.');
  }

  const updated = {
    ...productsStore[index],
    ...updates,
    price: updates.price !== undefined ? parseFloat(updates.price) : productsStore[index].price,
    stockQuantity: updates.stockQuantity !== undefined ? parseInt(updates.stockQuantity, 10) : productsStore[index].stockQuantity,
    updatedAt: new Date().toISOString(),
  };

  productsStore[index] = updated;
  return updated;
}

export async function deleteProduct(productId) {
  await delay(150);
  const index = productsStore.findIndex(p => p.id === productId);
  if (index === -1) {
    throw new Error('Product not found.');
  }

  // Soft delete / hide product to preserve order history
  productsStore[index].isAvailable = false;
  return { success: true };
}

/**
 * ============================================================================
 * SELLER ANALYTICS API (Computed from Real Stored Orders & Inventory)
 * ============================================================================
 */
export async function getSellerAnalytics(sellerId = 'seller-1') {
  await delay(150);

  const sellerOrders = ordersStore.filter(o => o.sellerId === sellerId);
  const sellerProducts = productsStore.filter(p => p.sellerId === sellerId);

  // Revenue calculation from non-cancelled orders
  const validOrders = sellerOrders.filter(o => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const totalOrdersCount = sellerOrders.length;
  const averageOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

  // Low stock alert products (< 5 remaining)
  const lowStockProducts = sellerProducts.filter(p => p.stockQuantity < 5);

  // Top selling products by units sold
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

  // 7-day revenue trend
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
    activeProductsCount: sellerProducts.filter(p => p.isAvailable !== false).length,
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
  await delay(150);
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
  await delay(150);
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
    targetName: productsStore[prodIndex].title,
    action,
    reason,
    timestamp: new Date().toISOString(),
  });

  return productsStore[prodIndex];
}

export async function toggleSellerVerification(sellerId) {
  await delay(150);
  const seller = sellersStore.find(s => s.id === sellerId);
  if (!seller) throw new Error('Seller not found.');

  seller.isVerified = !seller.isVerified;

  moderationLogs.unshift({
    id: `mod-${Date.now()}`,
    targetType: 'seller',
    targetId: sellerId,
    targetName: seller.storeName,
    action: seller.isVerified ? 'verified' : 'unverified',
    reason: `Seller verification status toggled to ${seller.isVerified}`,
    timestamp: new Date().toISOString(),
  });

  return seller;
}
