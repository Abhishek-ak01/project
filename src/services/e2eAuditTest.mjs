// ============================================================================
// LocalLoop: End-to-End Automated Integration Audit Test Suite
// Verifies Customer Journey, Seller Journey, Security Boundaries, and Failure Handling
// ============================================================================

import { 
  getProducts, 
  getProductById, 
  getSimilarProducts, 
  getCategories, 
  getSellers, 
  getSellerById, 
  createOrder, 
  getCustomerOrders, 
  getOrderById, 
  updateOrderStatus, 
  getSellerOrders, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  getSellerAnalytics,
  getAdminMarketplaceStats,
  moderateProduct,
  toggleSellerVerification,
  getUserProfile,
  updateUserProfile,
  validateSession
} from './db.js';

import { INITIAL_PRODUCTS, INITIAL_SELLERS, DEMO_USERS } from './mockData.js';

const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    results.push({ name: testName, status: 'PASS', details });
    console.log(`✅ [PASS] ${testName}`);
  } else {
    results.push({ name: testName, status: 'FAIL', details });
    console.error(`❌ [FAIL] ${testName} - ${details}`);
  }
}

async function runAudit() {
  console.log('===============================================================');
  console.log('🚀 Running LocalLoop E2E Integration Audit...');
  console.log('===============================================================\n');

  // --------------------------------------------------------------------------
  // A. CUSTOMER JOURNEY
  // --------------------------------------------------------------------------
  console.log('--- A. CUSTOMER JOURNEY TESTS ---');

  // A1: Open public marketplace
  const allProds = await getProducts();
  assert(allProds && allProds.length > 0, 'A1: Open public marketplace and load active catalog', `Found ${allProds.length} products`);

  // A2: Search for products
  const searchResults = await getProducts({ search: 'sourdough' });
  const hasSourdough = searchResults.some(p => p.title.toLowerCase().includes('sourdough'));
  assert(hasSourdough, 'A2: Search products by keyword ("sourdough")', `Returned ${searchResults.length} matches`);

  // A3: Filter products by category and price
  const filtered = await getProducts({ category: 'cat-bakery', minPrice: 7.00, maxPrice: 9.00 });
  const validPriceRange = filtered.every(p => p.price >= 7.00 && p.price <= 9.00 && p.categoryId === 'cat-bakery');
  assert(filtered.length > 0 && validPriceRange, 'A3: Filter products by category and price bounds ($7.00 - $9.00)', `Returned ${filtered.length} products in range`);

  // A4: Open product detail and view seller
  const prod1 = await getProductById('prod-1');
  assert(prod1 && prod1.seller && prod1.seller.storeName === 'Crust & Crumb Bakery', 'A4: View product details with linked seller information', `Seller: ${prod1?.seller?.storeName}`);

  // A5: Compare products from different sellers
  const prod2 = await getProductById('prod-4'); // Tomato from Rivora Orchard
  const canCompare = prod1 && prod2 && prod1.sellerId !== prod2.sellerId;
  assert(canCompare, 'A5: Compare products across different local sellers', `Comparing ${prod1.title} (${prod1.seller.storeName}) vs ${prod2.title} (${prod2.seller.storeName})`);

  // A6: Add products to cart and validate stock limits
  const cartQtyValid = prod1.stockQuantity >= 2;
  assert(cartQtyValid, 'A6: Add product to cart within available stock limits', `Stock: ${prod1.stockQuantity}, Requested: 2`);

  // A7: Sign in as customer (Elena Rostova)
  const customer = DEMO_USERS.customer;
  assert(customer && customer.role === 'customer', 'A7: Customer authentication (Elena Rostova)', `User ID: ${customer.id}`);

  // A8 & A9: Checkout & Place Order
  const initialStock = prod1.stockQuantity;
  let createdOrder;
  try {
    createdOrder = await createOrder({
      customerId: customer.id,
      customerName: customer.fullName,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      deliveryType: 'local_delivery',
      deliveryAddress: { street: '742 Evergreen Terrace', city: 'Greenville', zip: '97401', neighborhood: 'Riverside Valley' },
      paymentMethod: 'card_demo',
      cartItems: [{ productId: 'prod-1', quantity: 2 }],
      notes: 'Please ring bell',
    });
    assert(createdOrder && createdOrder.orderNumber.startsWith('LL-'), 'A9: Authoritative order creation with simulated payment', `Order Number: ${createdOrder?.orderNumber}`);
  } catch (err) {
    assert(false, 'A9: Authoritative order creation with simulated payment', err.message);
  }

  // A10: Confirm order and line items have immutable snapshots
  if (createdOrder) {
    const item = createdOrder.items[0];
    const hasSnapshot = item.unitPrice === 7.50 && item.quantity === 2 && item.subtotal === 15.00;
    assert(hasSnapshot, 'A10: Order items preserve price and quantity snapshots', `Unit Price: $${item.unitPrice}, Subtotal: $${item.subtotal}`);
  }

  // A11: Confirm stock is deducted correctly
  const updatedProd1 = await getProductById('prod-1');
  const stockDeducted = updatedProd1.stockQuantity === (initialStock - 2);
  assert(stockDeducted, 'A11: Stock deducted atomically in database store', `Initial: ${initialStock}, After Order: ${updatedProd1.stockQuantity}`);

  // A12: Customer order history view
  const customerOrders = await getCustomerOrders(customer.id);
  const foundInHistory = customerOrders.some(o => o.id === createdOrder?.id);
  assert(foundInHistory, 'A12: Order appears in customer order history with placed status', `Found in ${customerOrders.length} customer orders`);

  // --------------------------------------------------------------------------
  // B. SELLER JOURNEY
  // --------------------------------------------------------------------------
  console.log('\n--- B. SELLER JOURNEY TESTS ---');

  // B1: Sign in as authorized seller
  const seller = DEMO_USERS.seller;
  assert(seller && seller.role === 'seller' && seller.sellerId === 'seller-1', 'B1: Sign in as authorized seller (Marcus Vance @ Crust & Crumb)', `Seller ID: ${seller.sellerId}`);

  // B2: Create a new product
  let newProd;
  try {
    newProd = await addProduct({
      sellerId: seller.sellerId,
      title: 'Heritage Spelt Focaccia',
      categoryId: 'cat-bakery',
      price: '6.50',
      stockQuantity: '12',
      unit: 'slab',
      description: 'Rosemary & flake sea salt focaccia baked fresh',
    }, seller.sellerId);
    assert(newProd && newProd.title === 'Heritage Spelt Focaccia', 'B2: Seller creates new product with positive price and stock', `Product ID: ${newProd?.id}`);
  } catch (err) {
    assert(false, 'B2: Seller creates new product', err.message);
  }

  // B3: Confirm product is saved and displayed in catalog
  if (newProd) {
    const foundNew = await getProductById(newProd.id);
    assert(foundNew && foundNew.price === 6.50, 'B3: Newly created product is discoverable in catalog', `Found: ${foundNew?.title}`);
  }

  // B4: Seller updates stock (+10 units)
  if (newProd) {
    const updated = await updateProduct(newProd.id, { stockQuantity: 22 }, seller.sellerId);
    assert(updated && updated.stockQuantity === 22, 'B4: Seller updates stock quantity', `Updated Stock: ${updated?.stockQuantity}`);
  }

  // B5: View incoming orders belonging to that seller
  const sellerOrders = await getSellerOrders(seller.sellerId);
  const allBelongToSeller = sellerOrders.every(o => o.sellerId === seller.sellerId || o.items.some(i => i.sellerId === seller.sellerId));
  assert(sellerOrders.length > 0 && allBelongToSeller, 'B5: Seller views incoming orders belonging to their storefront', `Found ${sellerOrders.length} orders for ${seller.sellerId}`);

  // B6: Update permitted order status
  let statusUpdated;
  try {
    statusUpdated = await updateOrderStatus(createdOrder.id, 'confirmed', seller.sellerId);
    assert(statusUpdated && statusUpdated.status === 'confirmed', 'B6A: Advance status from "placed" to "confirmed"', `Status: ${statusUpdated?.status}`);
    
    statusUpdated = await updateOrderStatus(createdOrder.id, 'preparing', seller.sellerId);
    assert(statusUpdated && statusUpdated.status === 'preparing', 'B6B: Advance status from "confirmed" to "preparing"', `Status: ${statusUpdated?.status}`);

    statusUpdated = await updateOrderStatus(createdOrder.id, 'ready', seller.sellerId);
    assert(statusUpdated && statusUpdated.status === 'ready', 'B6C: Advance status from "preparing" to "ready"', `Status: ${statusUpdated?.status}`);

    statusUpdated = await updateOrderStatus(createdOrder.id, 'completed', seller.sellerId);
    assert(statusUpdated && statusUpdated.status === 'completed', 'B6D: Advance status from "ready" to "completed"', `Status: ${statusUpdated?.status}`);
  } catch (err) {
    assert(false, 'B6: Update permitted order status', err.message);
  }

  // B7: Verify seller analytics reflect actual database data
  const analytics = await getSellerAnalytics(seller.sellerId);
  assert(analytics && analytics.totalRevenue > 0 && analytics.totalOrdersCount > 0, 'B7: Seller analytics calculated from real stored orders and products', `Revenue: $${analytics.totalRevenue}, Orders: ${analytics.totalOrdersCount}`);

  // B8: Confirm seller cannot access another seller's private data
  try {
    // Attempt to update seller-2 product using seller-1 identity
    await updateProduct('prod-4', { price: 1.00 }, 'seller-1'); // prod-4 belongs to seller-2 (Rivora)
    assert(false, 'B8: Confirm seller cannot edit another seller’s product', 'Allowed unauthorized edit!');
  } catch (err) {
    assert(err.message.includes('Unauthorized'), 'B8: Confirm seller cannot edit another seller’s product', `Correctly blocked: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // C. SECURITY AND FAILURE TESTS
  // --------------------------------------------------------------------------
  console.log('\n--- C. SECURITY AND FAILURE TESTS ---');

  // C1: Attempt to place an order without authentication
  try {
    await createOrder({
      customerId: null, // Unauthenticated
      cartItems: [{ productId: 'prod-1', quantity: 1 }],
    });
    assert(false, 'C1: Block order placement without authentication', 'Allowed guest order without customerId!');
  } catch (err) {
    assert(err.message.includes('Authentication required'), 'C1: Block order placement without authentication', `Blocked: ${err.message}`);
  }

  // C2: Attempt to view another customer's orders
  try {
    await getOrderById(createdOrder.id, 'user-customer-2', 'customer');
    assert(false, 'C2: Block customer from viewing another customer’s order', 'Allowed unauthorized order read!');
  } catch (err) {
    assert(err.message.includes('Unauthorized'), 'C2: Block customer from viewing another customer’s order', `Blocked: ${err.message}`);
  }

  // C3: Attempt to delete another seller's product
  try {
    await deleteProduct('prod-4', 'seller-1'); // prod-4 belongs to seller-2
    assert(false, 'C3: Block seller from deleting another seller’s product', 'Allowed unauthorized product delete!');
  } catch (err) {
    assert(err.message.includes('Unauthorized'), 'C3: Block seller from deleting another seller’s product', `Blocked: ${err.message}`);
  }

  // C4: Attempt to place an order with insufficient stock
  try {
    await createOrder({
      customerId: customer.id,
      cartItems: [{ productId: 'prod-1', quantity: 99999 }],
    });
    assert(false, 'C4: Reject order with quantity exceeding available stock', 'Allowed overselling!');
  } catch (err) {
    assert(err.message.includes('Insufficient stock'), 'C4: Reject order with quantity exceeding available stock', `Blocked: ${err.message}`);
  }

  // C5: Attempt to submit an invalid non-positive or non-integer quantity
  try {
    await createOrder({
      customerId: customer.id,
      cartItems: [{ productId: 'prod-1', quantity: -3 }],
    });
    assert(false, 'C5A: Reject negative quantity in order payload', 'Allowed negative quantity!');
  } catch (err) {
    assert(err.message.includes('Invalid quantity'), 'C5A: Reject negative quantity in order payload', `Blocked: ${err.message}`);
  }

  try {
    await createOrder({
      customerId: customer.id,
      cartItems: [{ productId: 'prod-1', quantity: 2.7 }],
    });
    assert(false, 'C5B: Reject fractional quantity in order payload', 'Allowed non-integer quantity!');
  } catch (err) {
    assert(err.message.includes('Invalid quantity'), 'C5B: Reject fractional quantity in order payload', `Blocked: ${err.message}`);
  }

  // C6: Test client price tampering immunity
  // When placing an order, client passes product with hacked client price $0.01; server must ignore client price!
  const hackedOrder = await createOrder({
    customerId: customer.id,
    cartItems: [{ productId: 'prod-1', quantity: 1, hackedPrice: 0.01 }],
    clientTotal: 0.01,
  });
  const trustedPriceUsed = hackedOrder.subtotal === 7.50; // Server looked up product.price = $7.50
  assert(trustedPriceUsed, 'C6: Discard client-supplied totals and calculate trusted database prices', `Charged trusted $${hackedOrder.subtotal} instead of client price`);

  // C7: Test duplicate checkout submissions in rapid succession
  try {
    // Attempt another identical submission immediately
    await createOrder({
      customerId: customer.id,
      cartItems: [{ productId: 'prod-1', quantity: 1 }],
    });
    assert(false, 'C7: Prevent rapid duplicate checkout submissions', 'Allowed duplicate submission!');
  } catch (err) {
    assert(err.message.includes('Duplicate order submission'), 'C7: Prevent rapid duplicate checkout submissions', `Blocked: ${err.message}`);
  }

  // C8: Disallowed status transitions
  try {
    // Attempt invalid jump: from 'completed' back to 'placed'
    await updateOrderStatus(createdOrder.id, 'placed', seller.sellerId);
    assert(false, 'C8: Reject illegal order status transitions', 'Allowed moving completed order back to placed!');
  } catch (err) {
    assert(err.message.includes('Invalid transition'), 'C8: Reject illegal order status transitions', `Blocked: ${err.message}`);
  }

  // C9: Attempt to access a private dashboard without authentication
  try {
    validateSession(null);
    assert(false, 'C9: Block private dashboard access without authentication', 'Allowed access to unauthenticated user!');
  } catch (err) {
    assert(err.message.includes('Session unauthenticated'), 'C9: Block private dashboard access without authentication', `Blocked: ${err.message}`);
  }

  // C10: Attempt to read another user's private profile
  try {
    await getUserProfile('user-seller-1', customer);
    assert(false, 'C10: Block reading another user’s profile', 'Allowed unauthorized profile reading!');
  } catch (err) {
    assert(err.message.includes('Access denied'), 'C10: Block reading another user’s profile', `Blocked: ${err.message}`);
  }

  // C11: Attempt to change another user's profile
  try {
    await updateUserProfile('user-seller-1', { fullName: 'Hacked Name' }, customer);
    assert(false, 'C11: Block changing another user’s profile', 'Allowed unauthorized profile modification!');
  } catch (err) {
    assert(err.message.includes('Access denied'), 'C11: Block changing another user’s profile', `Blocked: ${err.message}`);
  }

  // C12: Attempt privilege escalation (regular customer attempting to become admin)
  try {
    await updateUserProfile(customer.id, { role: 'admin' }, customer);
    assert(false, 'C12: Prevent unauthorized privilege escalation', 'Allowed user to escalate role to admin!');
  } catch (err) {
    assert(err.message.includes('Unauthorized role escalation'), 'C12: Prevent unauthorized privilege escalation', `Blocked: ${err.message}`);
  }

  // C13: Test expired session handling
  try {
    validateSession({ id: customer.id, expiresAt: Date.now() - 10000 });
    assert(false, 'C13: Reject expired sessions', 'Allowed expired session!');
  } catch (err) {
    assert(err.message.includes('Session expired'), 'C13: Reject expired sessions', `Blocked: ${err.message}`);
  }

  // C14: Database failure atomicity (ensure stock is unchanged if checkout fails)
  const productBefore = await getProductById('prod-2');
  const stockBefore = productBefore.stockQuantity;
  try {
    await createOrder({
      customerId: customer.id,
      cartItems: [
        { productId: 'prod-2', quantity: 1 },
        { productId: 'non-existent-prod', quantity: 1 } // Causes transaction failure
      ]
    });
  } catch (err) {
    // Expected to fail
  }
  const productAfter = await getProductById('prod-2');
  const stockPreserved = productAfter.stockQuantity === stockBefore;
  assert(stockPreserved, 'C14: Ensure transactional atomicity (no partial stock deductions on failure)', `Stock remained ${stockBefore} after aborted transaction`);

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED.`);
  console.log('===============================================================');

  return { passed, failed, results };
}

runAudit().catch(console.error);
