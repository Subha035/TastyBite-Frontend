<div align="center">

# 🍽️ TastyBite — Frontend

**React + Vite frontend for the TastyBite AI-powered restaurant platform.**
Browse the menu, place orders, book tables, chat with the AI assistant and manage everything from a sleek admin dashboard.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payments-072654?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)

[🌐 Live Demo](https://tastybite-spye.onrender.com) · [🐛 Report Bug](https://github.com/Subha035/TastyBite-Frontend/issues)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Project Structure](#️-project-structure)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Environment Variables](#️-environment-variables)
- [🧩 Components](#-components)
- [🔌 API Service](#-api-service)
- [🔐 Authentication](#-authentication)
- [🌙 Theme System](#-theme-system)
- [📦 Scripts](#-scripts)

---

## ✨ Features

### 👤 Customer Features

| Feature | Description |
|---|---|
| 🏠 **Home** | Animated landing hero section with restaurant highlights |
| 🍕 **Menu** | Browse items with veg/non-veg filters, search and live stock status |
| 🛒 **Place Order** | Full cart experience with Razorpay checkout & QR bill generation |
| 🪑 **Reservations** | Book a table by date, time slot and guest count |
| 🎁 **Offers** | View and apply active promo codes & discounts |
| 💬 **AI Chat** | Gemini-powered chatbot answering menu, offer and booking questions |
| 👤 **Auth** | Google OAuth + Email/Password signup & login via Firebase |
| 📞 **Contact** | Contact form with restaurant location & hours |
| 🌙 **Dark / Light Mode** | Universal theme toggle persisted across sessions |

### 🔑 Admin Features

| Feature | Description |
|---|---|
| 📊 **Dashboard** | Live activity feed and stats overview |
| 🍽️ **Menu Manager** | Add, edit, delete menu items with veg flag & availability toggle |
| 🎟️ **Offers Manager** | Create and manage discount promo codes |
| 📋 **Order Management** | Track and update order statuses end-to-end |
| 🗓️ **Reservation Management** | Approve, reject and manage table bookings |
| 🔒 **Secure Admin Login** | Credential-based admin authentication |

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI component framework |
| **Vite** | 8 | Build tool & HMR dev server |
| **Vanilla CSS** | — | Design system via CSS custom properties |
| **Firebase JS SDK** | 12 | Google OAuth & user authentication |
| **Lucide React** | latest | Icon library |
| **QRCode.js** | 1.5 | QR code generation for bills & bookings |
| **Razorpay JS SDK** | — | Payment gateway integration |
| **Oxlint** | 1.71 | Fast JavaScript/JSX linter |

---

## 🏗️ Project Structure

```
Frontend/
├── 📁 src/
│   ├── 📁 components/                  # All UI components
│   │   ├── HomeSection.jsx             # Hero landing section
│   │   ├── HomeSection.css
│   │   ├── MenuSection.jsx             # Customer menu browser with filters
│   │   ├── MenuSection.css
│   │   ├── PlaceOrder.jsx              # Cart, checkout & Razorpay integration
│   │   ├── ReservationsSection.jsx     # Table booking form
│   │   ├── ReservationsSection.css
│   │   ├── OffersSection.jsx           # Promo codes display
│   │   ├── OffersSection.css
│   │   ├── ChatArea.jsx                # AI chatbot interface
│   │   ├── ContactSection.jsx          # Contact info & form
│   │   ├── Sidebar.jsx                 # Navigation sidebar
│   │   ├── RightPanel.jsx              # Live menu quick-view panel
│   │   ├── AuthModal.jsx               # Login / Signup modal
│   │   ├── AuthModal.css
│   │   ├── AdminLogin.jsx              # Admin credential login screen
│   │   ├── AdminPanel.jsx              # Admin dashboard
│   │   ├── AdminOrders.jsx             # Order management table
│   │   ├── AdminReservations.jsx       # Reservation management table
│   │   ├── MenuManager.jsx             # Menu CRUD admin view
│   │   └── OffersManager.jsx           # Offers CRUD admin view
│   ├── 📁 services/
│   │   └── apiService.js               # Centralized API client (cache + dedup)
│   ├── 📁 assets/                      # Static assets (images, icons)
│   ├── firebaseConfig.js               # Firebase app initialization
│   ├── App.jsx                         # Root component & tab-based routing
│   ├── App.css                         # App-level styles
│   ├── index.css                       # Global design system & CSS variables
│   └── main.jsx                        # React DOM entry point
├── 📁 assets/
│   └── table_booking/                  # Saved QR codes for table bookings
├── index.html                          # HTML shell
├── vite.config.js                      # Vite + custom QR file plugin
├── package.json
├── .env                                # Local env vars (gitignored)
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- A running **TastyBite Backend** (or use the hosted API)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Subha035/TastyBite-Frontend.git
cd TastyBite-Frontend

# 2. Install dependencies
npm install

# 3. Set up environment variables
#    Create a .env file in this directory (see below)

# 4. Start the development server
npm run dev
```

The app will be live at **http://localhost:5173** 🚀

---

## ⚙️ Environment Variables

Create a `.env` file in the `Frontend/` root:

```env
# URL of the TastyBite backend API
VITE_API_URL=https://tastybite-spye.onrender.com/api

# Razorpay public Key ID (NEVER include the secret key here)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

> ⚠️ This file is listed in `.gitignore` — **never commit it to source control.**

All environment variables must be prefixed with `VITE_` to be accessible in the browser via `import.meta.env`.

---

## 🧩 Components

### Customer Components

| Component | Route/Tab | Description |
|---|---|---|
| [`HomeSection`](./src/components/HomeSection.jsx) | `home` | Animated hero, highlights & CTA |
| [`MenuSection`](./src/components/MenuSection.jsx) | `menu` | Menu grid with veg filter & search |
| [`PlaceOrder`](./src/components/PlaceOrder.jsx) | `order` | Cart management & payment flow |
| [`ReservationsSection`](./src/components/ReservationsSection.jsx) | `reservations` | Table booking form |
| [`OffersSection`](./src/components/OffersSection.jsx) | `offers` | Active discount codes |
| [`ChatArea`](./src/components/ChatArea.jsx) | `chat` | AI assistant chat window |
| [`ContactSection`](./src/components/ContactSection.jsx) | `contact` | Restaurant details & contact form |

### Layout Components

| Component | Description |
|---|---|
| [`Sidebar`](./src/components/Sidebar.jsx) | Left navigation with tab links & auth state |
| [`RightPanel`](./src/components/RightPanel.jsx) | Right panel showing live menu summary |
| [`AuthModal`](./src/components/AuthModal.jsx) | Animated login/signup modal with Google OAuth |

### Admin Components

| Component | Tab | Description |
|---|---|---|
| [`AdminLogin`](./src/components/AdminLogin.jsx) | `admin` | Admin credential gate |
| [`AdminPanel`](./src/components/AdminPanel.jsx) | `admin` | Dashboard with activity feed |
| [`MenuManager`](./src/components/MenuManager.jsx) | `menu-manager` | Full menu CRUD interface |
| [`OffersManager`](./src/components/OffersManager.jsx) | `offers-manager` | Full offers CRUD interface |
| [`AdminOrders`](./src/components/AdminOrders.jsx) | `orders` | Order tracking & status updates |
| [`AdminReservations`](./src/components/AdminReservations.jsx) | `admin-reservations` | Booking approval/rejection |

---

## 🔌 API Service

All backend communication is handled through [`src/services/apiService.js`](./src/services/apiService.js), which provides:

### Smart Caching & Deduplication
- **30-second TTL cache** for all `GET` requests — instant re-renders without redundant network calls
- **In-flight request deduplication** — if two components call the same endpoint simultaneously, only one HTTP request is made
- **Automatic cache invalidation** — any `POST`, `PUT` or `DELETE` clears the relevant resource cache

### Token Management
```js
getAuthToken()      // Reads JWT from localStorage
setAuthToken(token) // Stores or clears JWT
getStoredUser()     // Reads cached user profile
setStoredUser(user) // Stores or clears user profile
```

### Available API Functions

```js
// Auth
signupUser(name, email, password)
loginUser(email, password)
loginWithGoogle(idToken, email, name, picture)
getCurrentUser()
logoutUser()

// Menu
getMenuItems()
createMenuItem(item)
updateMenuItem(id, item)
deleteMenuItem(id)

// Orders
getOrders()
createOrder(order)
updateOrderStatus(id, status)
updateOrderPaymentStatus(id, paymentStatus)

// Reservations
getReservations()
createReservation(reservation)
updateReservationStatus(id, status)
deleteReservation(id)

// Offers
getOffers()
createOffer(offer)
updateOffer(id, offer)
deleteOffer(id)

// Chat
sendChatMessage(messageText)

// Admin & Activities
adminLogin(usernameOrEmail, password)
getActivities()
logActivity(title, category)
```

---

## 🔐 Authentication

Authentication is handled by **Firebase** on the frontend and validated with **JWT** by the backend.

### Customer Auth Flow

```
User clicks Login
      │
      ├─ Google Sign-In ──► Firebase OAuth ──► ID Token
      │                                            │
      │                              POST /auth/google (idToken)
      │                                            │
      │◄─────────────── JWT Token + User Profile ──┘
      │
      └─ Email/Password ──► POST /auth/login ──► JWT Token
```

- JWT is stored in `localStorage` as `tastybite_jwt_token`
- All authenticated API calls send `Authorization: Bearer <JWT>` automatically
- User profile is cached in `localStorage` as `tastybite_user_profile`

### Admin Auth Flow

- Admin credentials are sent to `POST /api/admin/login`
- On success, `tastybite-admin-auth = true` is stored in `localStorage`/`sessionStorage`
- Admin session persists across page refreshes

---

## 🌙 Theme System

TastyBite supports a full **dark/light mode** toggle built on CSS custom properties.

- Theme preference is persisted in `localStorage`
- The toggle is accessible via the sun/moon icon in the top bar
- All components respect the theme via CSS variables defined in [`index.css`](./src/index.css)

```css
/* Example CSS variable usage */
background: var(--bg-primary);
color: var(--text-primary);
border: 1px solid var(--border-color);
```

---

## 📦 Scripts

```bash
npm run dev        # Start development server → http://localhost:5173
npm run build      # Build for production → ./dist
npm run preview    # Serve the production build locally
npm run lint       # Run oxlint static analysis
```

### Production Build

```bash
npm run build
# Output is in the dist/ directory — deploy to any static host:
# Vercel, Netlify, Render, GitHub Pages, etc.
```

---

## 🔧 Vite Configuration

[`vite.config.js`](./vite.config.js) includes a custom **Booking QR File Plugin** that adds a local middleware endpoint (`POST /api/bookings/qr`) during development and preview. This endpoint saves base64-encoded QR code images to `assets/table_booking/` for reservation confirmations.

---

<div align="center">


⭐ Star the repo if you find it useful!

</div>
