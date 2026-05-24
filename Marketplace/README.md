# ServiceHub — Multi-Vendor Service Marketplace

A portfolio-quality, frontend-only demo of a multi-vendor service marketplace platform. Built to showcase modern React engineering: role-based dashboards, booking flows, analytics, onboarding wizards, mock payments, and real-time simulations — all without a backend.

![ServiceHub](public/favicon.svg)

## Quick Start

```bash
cd Marketplace
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

**Demo script:** See [test.md](test.md) for a 5-step walkthrough (~7 minutes).

### Build for production

```bash
npm run build
npm run preview
```

## Demo Accounts

Use one-click role buttons on the login page, or sign in manually:

| Role     | Email                  | Password     |
|----------|------------------------|--------------|
| Customer | `customer@example.com` | `password123` |
| Vendor   | `vendor@example.com`   | `password123` |
| Admin    | `admin@example.com`    | `password123` |

## Business Logic

### Platform Overview

ServiceHub connects **customers** who need local services with **vendors** who provide them. **Admins** oversee platform health, vendor verification, and user management.

### User Roles

- **Customer** — Browse marketplace, book services, track orders, manage wallet & profile
- **Vendor** — Onboard business, manage services/promotions, accept bookings, view analytics
- **Admin** — Monitor KPIs, verify vendors, manage users/categories, broadcast notifications

### Booking Lifecycle

```
Pending → Confirmed → Vendor Assigned → On The Way → In Progress → Completed
                                                              ↘ Cancelled
```

1. Customer selects a service, package, date/time, and address
2. Mock payment is processed (card, wallet, PayPal, GrabPay, Apple Pay UI)
3. Vendor accepts/rejects and updates status through the workflow
4. Customer tracks progress via animated timeline + mock GPS map
5. Background simulation auto-advances active bookings every 15 seconds

### Vendor Verification

```
Pending → Approved | Rejected | Needs More Info
```

8-step onboarding wizard collects business info, categories, documents, banking, and service areas. Admins review and approve/reject from the verification panel.

### Payment Flow (Mock)

- Wallet balance with top-up simulation
- Credit card form UI (no real processing)
- Transaction history with invoice download
- Refund status for cancelled bookings
- Fake integrations: Stripe, PayPal, GrabPay, Apple Pay badges

### Data Persistence

All data is stored in **LocalStorage** under the `servicehub:` namespace:

- Auth session, users, vendors, services, bookings
- Notifications, transactions, promotions, activity logs
- Theme and settings preferences

On first load, the app seeds realistic demo data:
- 20+ vendors, 100+ services, 50+ bookings, 200+ notifications

Reset demo data from **Admin → Settings** or clear LocalStorage and refresh.

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Framework      | React 19 + TypeScript               |
| Build          | Vite 8                              |
| Styling        | Tailwind CSS 4 + shadcn-like UI     |
| Routing        | React Router 7                      |
| State          | Zustand                             |
| Forms          | React Hook Form + Zod               |
| Charts         | Recharts                            |
| Animations     | Framer Motion                         |
| Notifications  | Sonner (toast)                      |
| Command Menu   | cmdk                                |
| Persistence    | LocalStorage                        |
| PWA            | vite-plugin-pwa                     |

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn-style primitives
│   ├── layout/       # Sidebar, search, command palette
│   ├── booking/      # Timeline, status badges
│   ├── charts/       # Recharts wrappers
│   ├── maps/         # Mock map components
│   ├── notifications/
│   └── shared/       # PageHeader, EmptyState, animations
├── pages/
│   ├── auth/         # Login, register, forgot password, OTP
│   ├── customer/     # Marketplace, bookings, wallet, profile
│   ├── vendor/       # Dashboard, services, kanban, onboarding
│   ├── admin/        # Verification, users, monitoring
│   └── public/       # Landing, help, FAQ, terms
├── layouts/          # Auth, Dashboard, Public layouts
├── routes/           # Router config + protected routes
├── store/            # Zustand stores (auth, app, settings)
├── services/         # mockApi, storageService, simulation
├── hooks/            # useDebounce, useMediaQuery, useOnlineStatus
├── types/            # TypeScript interfaces
├── data/             # Seed data generators + demo accounts
└── utils/            # cn, formatters, CSV export
```

## Feature Highlights

### All Roles
- Dark/light mode with system preference
- Command palette (`⌘K`) + global search
- Notification center with unread badges + toast alerts
- Keyboard shortcuts (`?`)
- Offline indicator
- Responsive sidebar + mobile drawer
- Framer Motion page transitions

### Customer
- Marketplace with search, filters, grid/list toggle, pagination
- Service detail with reviews, packages, FAQ
- 5-step booking wizard
- Real-time tracking simulation with mock GPS map
- Wallet, referrals, loyalty points

### Vendor
- Earnings dashboard with Recharts analytics
- 8-step onboarding wizard
- Service & promotion CRUD
- Booking management with chat mockup
- Kanban task board
- Peak hours & retention charts

### Admin
- Platform KPI dashboard
- Vendor verification workflow
- User/vendor/category CRUD
- Live monitoring feed + fraud alert mockups
- Maintenance mode toggle
- Broadcast notifications

## Architecture

```
UI (Pages/Layouts) → Zustand Stores → mockApi (async + delay) → LocalStorage
                                              ↑
                                    simulationService (intervals)
```

All mutations go through `mockApi.ts` which simulates 200–800ms network latency. Components never write to LocalStorage directly.

## Scripts

| Command         | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Start dev server         |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm run lint`  | ESLint                   |

## License

Demo project for portfolio showcase. Not for production use.
