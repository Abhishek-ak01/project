# LocalLoop — Local Small Business Digital Marketplace

A modern, editorial-style e-commerce marketplace empowering neighborhood small businesses (bakeries, urban farms, micro-creameries, and beekeepers) to thrive alongside conscious local consumers.

---

## 🌟 Hackathon Highlights & Innovations

1. **Local-First Discovery**: Filter provisions by neighborhood tag (e.g. *Riverside Valley*, *Eastside Mill District*, *Oakwood Hills*), origin farm distance, and direct seller contact.
2. **Side-by-Side Product Comparison Matrix**: Compare up to 3 local items from different independent sellers across price per unit, organic certification, shelf-life freshness, and customer ratings.
3. **Inventory-Aware Atomic Checkout**: Authoritative pricing and live stock check that decrements inventory upon purchase and prevents race conditions.
4. **Live 5-Step Order Status Pipeline**: Tracks customer orders from `Order Placed` ➔ `Confirmed by Maker` ➔ `Preparing / Baking` ➔ `Ready for Pickup / Out for Delivery` ➔ `Fulfilled`.
5. **Real Seller Analytics**: Recharts revenue velocity charts, low-stock alerts (< 5 units), and top-selling product metrics.
6. **One-Click Persona Switcher**: Top banner pill allowing hackathon judges to instantly toggle between **Shopper** (Elena Rostova), **Seller** (Marcus Vance @ Crust & Crumb Bakery), and **Admin** (Sarah Jenkins).

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite 8
- **Styling**: Tailwind CSS v3.4 + PostCSS with custom typography and warm editorial tokens
- **Routing**: React Router v7 with role-based route guards (`ProtectedRoute`)
- **Icons**: Lucide React
- **Analytics & Data Vis**: Recharts
- **Database & Auth Ready**: Supabase PostgreSQL client + full SQL DDL with Row Level Security (RLS) in `supabase/schema.sql`
- **Data Access Layer**: Reactive hybrid repository pattern with authentic async simulation, zero-setup out of the box, and seamless live Supabase toggle.

---

## 🚀 Getting Started

### 1. Install & Run Dev Server
```bash
npm install
npm run dev
```
The application will launch on `http://localhost:5173/`.

### 2. Evaluator Demo Personas
Click the **"Persona"** dropdown pill in the top navbar to instantly test all 3 personas:
- **🛒 Customer (Elena Rostova)**: Browse marketplace, compare sourdoughs, add to cart, and checkout.
- **🥖 Seller (Marcus Vance)**: Access `/seller/dashboard`, adjust stock in `/seller/products`, and advance order status in `/seller/orders`.
- **🛡️ Admin (Sarah Jenkins)**: Access `/admin` to inspect total GMV, toggle seller verification badges, and flag/approve products.

### 3. Connect Live Supabase (Optional)
Copy `.env.example` to `.env` and fill in your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
Execute `supabase/schema.sql` in the Supabase SQL Editor to initialize all tables, RLS policies, and the `process_atomic_checkout` stored procedure.
