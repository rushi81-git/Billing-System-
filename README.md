# 🏪 Smart Billing POS System

A production-grade Smart Billing Point-of-Sale system with barcode scanning, JWT auth, PDF invoices, SMS/WhatsApp notifications, and payment reminders.

---

## 📁 Project Structure

```
smart-pos/
├── backend/
│   ├── config/         # Database config (Sequelize + MySQL)
│   ├── controllers/    # Auth, Customer, Bill, Product controllers
│   ├── models/         # Owner, Customer, Bill, BillItem, Notification
│   ├── routes/         # Auth, Customer, Bill, Product routes
│   ├── middleware/     # JWT auth, error handler, validator
│   ├── services/       # Notification service (SMS + WhatsApp)
│   ├── cron/           # Payment reminder job (node-cron)
│   ├── utils/          # PDF generator, bill ID generator, response helper
│   ├── public/invoices # Auto-created; stores generated PDFs
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/ # Layout, BarcodeScanner, CartDisplay, CustomerForm, ProtectedRoute
│   │   ├── context/    # AuthContext, CartContext
│   │   ├── pages/      # Login, Register, POS, Bills, Customers, Invoice
│   │   ├── services/   # Axios API service
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## ⚙️ Prerequisites

- **Node.js** ≥ 18.x
- **MySQL** ≥ 8.0
- **npm** ≥ 9.x

---

## 🗄️ MySQL Setup

### Step 1 – Create the database

```sql
CREATE DATABASE smart_pos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pos_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON smart_pos_db.* TO 'pos_user'@'localhost';
FLUSH PRIVILEGES;
```

> **Tables are auto-created** by Sequelize `sync({ alter: true })` on first server start.  
> No manual migration needed.

---

## 🔧 Backend Setup

### Step 1 – Install dependencies
```bash
cd backend
npm install
```

### Step 2 – Create .env file
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_pos_db
DB_USER=pos_user
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_key_min_32_characters
JWT_EXPIRES_IN=8h

SHOP_NAME=My Retail Store
SHOP_ADDRESS=123 Main Street, Mumbai 400001
SHOP_PHONE=+919876543210
SHOP_EMAIL=shop@mystore.com

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_API_VERSION=v18.0

APP_BASE_URL=http://localhost:5173
API_BASE_URL=http://localhost:5000
```

### Step 3 – Start backend
```bash
# Development
npm run dev

# Production
npm start
```

---

## 💻 Frontend Setup

### Step 1 – Install dependencies
```bash
cd frontend
npm install
```

### Step 2 – Create .env file
```bash
cp .env.example .env
```

`.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Smart POS
```

### Step 3 – Start frontend
```bash
npm run dev
```

---

## 🚀 Quick Start (Both Together)

```bash
# Terminal 1 – Backend
cd backend && npm install && npm run dev

# Terminal 2 – Frontend
cd frontend && npm install && npm run dev
```

Then open: **http://localhost:5173**

First visit → go to `/register` to create the owner account.

---

## 📱 Twilio SMS Setup

1. Sign up at https://www.twilio.com
2. Get a phone number with SMS capability
3. Copy your **Account SID** and **Auth Token** from the Console
4. Add to `.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxx
   TWILIO_AUTH_TOKEN=xxxx
   TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
   ```

> **Trial accounts**: You can only SMS verified numbers. Upgrade for production.

---

## 💬 WhatsApp Cloud API Setup

1. Go to https://developers.facebook.com
2. Create an app → Add **WhatsApp** product
3. Set up a WhatsApp Business Account
4. Get your **Phone Number ID** and **Temporary Access Token**
5. Add to `.env`:
   ```
   WHATSAPP_PHONE_NUMBER_ID=xxxxxxxxxx
   WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxx
   WHATSAPP_API_VERSION=v18.0
   ```

> For production: generate a **permanent System User Access Token** via Business Manager.

---

## 🔐 Authentication Flow

1. **Register** (one-time): `POST /api/auth/register`
2. **Login**: `POST /api/auth/login` → returns JWT token
3. Frontend stores token in `localStorage`
4. All protected routes require `Authorization: Bearer <token>`
5. Token expires after `JWT_EXPIRES_IN` (default: 8 hours)
6. **Logout** removes token from client

---

## 📋 API Endpoints

### Auth
```
POST   /api/auth/register     – Register owner (one-time)
POST   /api/auth/login        – Login, get JWT
GET    /api/auth/me           – Get current owner  [protected]
POST   /api/auth/logout       – Logout            [protected]
```

### Customers
```
POST   /api/customers/lookup  – Lookup or create customer  [protected]
GET    /api/customers         – List all customers         [protected]
GET    /api/customers/:id/bills – Customer bill history    [protected]
```

### Products
```
POST   /api/products/scan     – Lookup product by SKU  [protected]
GET    /api/products          – List all products      [protected]
```

### Bills
```
POST   /api/bills/checkout    – Full checkout + PDF + notifications  [protected]
GET    /api/bills             – List all bills         [protected]
GET    /api/bills/:id         – Get bill details       [protected]
PATCH  /api/bills/:id/status  – Update payment status  [protected]
GET    /api/bills/invoice/:token – Public invoice view (no auth)
```

---

## 🧾 Checkout Flow

1. Set customer name + phone (lookup or create)
2. Scan barcodes → products added to cart
3. Apply discount if any
4. Set payment status (PAID / PENDING)
5. Click Checkout:
   - Sequelize transaction starts
   - Customer created/fetched
   - Bill created with unique `bill_id` + `public_token`
   - Bill items inserted
   - Transaction committed
   - PDF generated
   - SMS + WhatsApp sent asynchronously
6. Invoice URL returned to UI

---

## ⏰ Payment Reminder Cron

- Runs **daily at 9:00 AM**
- Finds all `PENDING` bills where `due_date < today`
- Sends SMS + WhatsApp reminder to each customer
- Logs each reminder in `notifications` table
- Stops automatically once bill is marked `PAID`

---

## 📄 Invoice Page

Public URL format:
```
http://localhost:5173/invoice/<public_token>
```

Shows:
- Shop details
- Customer name + phone
- All items with quantities and prices
- Subtotal, discount, total
- Payment status badge
- Download PDF button
- Fully mobile responsive

---

## 🔒 Security Features

- **bcryptjs** password hashing (12 rounds)
- **JWT** with expiration
- **Helmet** HTTP security headers
- **Rate limiting**: 300 req / 15 min per IP
- **CORS** whitelist
- **Input validation** via express-validator
- **Sequelize transactions** for checkout atomicity
- Protected routes with 401/403 responses

---

## 🛠 Extending the Product Catalog

Currently uses an in-memory demo catalog in `controllers/productController.js`.

To use a real database:
1. Create a `products` table (Sequelize model)
2. Replace the `DEMO_PRODUCTS` array with a DB query
3. Add CRUD routes for product management

---

## ❓ Troubleshooting

| Problem | Fix |
|---------|-----|
| DB connection failed | Check MySQL is running, verify `.env` DB credentials |
| Camera not starting | Allow browser camera permission (HTTPS required in production) |
| SMS not sending | Verify Twilio SID/token, phone number format `+91xxxxxxxxxx` |
| WhatsApp failing | Check access token hasn't expired, verify Phone Number ID |
| PDF not generating | Ensure `backend/public/invoices/` directory is writable |
| 401 on all requests | Token expired – log out and log in again |
