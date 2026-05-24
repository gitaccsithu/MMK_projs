# ServiceHub — Demo Script

## What is ServiceHub?

ServiceHub is a **local services marketplace** — think Fiverr meets Grab for everyday jobs. Customers find trusted providers nearby, book a time slot, pay through the app, and track the job to completion. Vendors run their business on the platform. Admins keep the marketplace safe and growing.

This demo is **frontend-only** (no real backend). All data is mocked and saved in the browser.

---

## Services on the platform

Vendors list services across **10 categories**:

| Category | Examples |
|----------|----------|
| Home Cleaning | Deep clean, regular housekeeping |
| Plumbing | Leak repair, pipe installation |
| Electrical Repair | Wiring, outlet fixes |
| Air Conditioner Service | AC install, maintenance |
| Beauty & Spa | Hair, nails, massage |
| Car Wash | Interior/exterior wash |
| Food Catering | Event catering, meal prep |
| Moving Service | Home/office relocation |
| Photography | Events, portraits |
| Computer Repair | Laptop/PC fixes |

Each service has **pricing packages** (e.g. Basic vs Premium), ratings, reviews, and availability.

---

## How customers use it

1. **Browse** the marketplace — search, filter by category, price, rating, or distance.
2. **View** a service — read reviews, compare packages, check the vendor profile.
3. **Book** — pick date/time, address, package, and payment method.
4. **Pay** — card, wallet, PayPal, GrabPay, or Apple Pay (mock UI).
5. **Track** — follow status updates and a live map while the vendor is on the way.
6. **Manage** — reschedule or cancel bookings, view wallet history, earn loyalty points.

**Booking lifecycle:**

```
Pending → Confirmed → Vendor Assigned → On The Way → In Progress → Completed
                                                              ↘ Cancelled
```

---

## How vendors register

Vendors join ServiceHub in **three stages**: create an account → complete business onboarding → get approved by admin.

### Stage 1 — Sign up (entry point)

**Where:** Public **Register** page → [`/register`](http://localhost:5173/register) (link from Login or landing page)

1. Fill in name, email, password.
2. Under **“I want to”**, choose **Offer services (Vendor)**.
3. Submit → redirected to **OTP verification** (demo UI), then log in.

This creates a **vendor user account** (login credentials with role `vendor`). It does not yet publish a business on the marketplace.

**Demo shortcut:** Use **`vendor@example.com`** / `password123` — already linked to **SparkClean Pro Services**, an approved vendor. Use this for demos instead of signing up from scratch.

### Stage 2 — Business onboarding (vendor dashboard)

**Where:** Vendor sidebar → **Onboarding** → `/vendor/onboarding`

An 8-step wizard collects everything needed to operate on the platform:

| Step | What the vendor provides |
|------|--------------------------|
| 1 | Business name & type |
| 2 | Registration number |
| 3 | Service categories |
| 4 | Compliance documents (upload mock) |
| 5 | Banking / payout details |
| 6 | Business location |
| 7 | Service coverage areas |
| 8 | Review & submit |

After submit, verification status is **Pending** — the vendor cannot go fully live until admin approves.

> **Note:** Onboarding requires a **vendor business profile** linked to the logged-in user. The demo account already has one. A brand-new sign-up would need that link (in a production app this would be created automatically on register; in this demo, use the pre-seeded vendor login).

### Stage 3 — Admin verification

**Where:** Admin sidebar → **Verification** → `/admin/verification`

An admin reviews the submitted business and documents, then:

- **Approve** → vendor becomes active, services visible, bookings allowed  
- **Reject** → vendor blocked  
- **Needs more info** → vendor must update onboarding and resubmit  

Admins can also manage vendor records under **Admin → Vendors** and create user accounts under **Admin → Users**.

### Pre-loaded marketplace vendors

On first app load, **20+ vendor businesses** are seeded into LocalStorage so customers always have services to browse. These are the listings you see in the **Marketplace**. Most are background demo data; **`vendor@example.com`** is the login tied to the main demo vendor you operate in Tests 2 and 3.

**Vendor registration flow (summary):**

```
/register (choose Vendor) → OTP → Login → /vendor/onboarding (8 steps)
                                              ↓
                                    Admin /admin/verification
                                              ↓
                              Approved → list services → receive bookings
```

---

## Business logic (brief)

| Flow | What happens |
|------|--------------|
| **Vendor registration** | Sign up at `/register` as Vendor → complete `/vendor/onboarding` → admin approves at `/admin/verification` → vendor goes live. |
| **Vendor onboarding** | 8-step wizard (business info, documents, banking, location). Status stays **pending** until admin acts. |
| **Booking** | Customer creates a booking → vendor accepts → status moves through the pipeline → payment is recorded. |
| **Payments** | Mock wallet + card flows. Transactions appear in history; cancelled bookings can show refunds. |
| **Verification** | Admin reviews vendor documents → Approve / Reject / Request more info. |
| **Notifications** | Booking updates, payments, and promos push to the notification center (simulated in the background). |

---

## Dashboards — who uses what?

### Customer dashboard (`/customer`)
For people **booking services**.

- **Dashboard** — upcoming bookings, spending overview, favorites, recommendations.
- **Marketplace** — browse and book services.
- **My Bookings** — view, reschedule, cancel, track orders.
- **Wallet** — balance, transactions, payment methods.
- **Profile / Settings** — addresses, notifications, account preferences.

### Vendor dashboard (`/vendor`)
For **business owners** offering services.

- **Dashboard** — earnings, booking stats, satisfaction score, revenue charts.
- **Bookings** — accept/reject jobs, update status, chat with customers (mock).
- **Kanban** — drag bookings across status columns.
- **Services** — create/edit/delete listings and packages.
- **Promotions** — coupon codes and discounts.
- **Analytics** — revenue trends, peak hours, retention.
- **Onboarding** — complete setup until admin verification.

### Admin dashboard (`/admin`)
For **platform operators** running ServiceHub.

- **Dashboard** — total users, vendors, bookings, revenue, growth charts, activity feed.
- **Verification** — review and approve/reject vendor applications.
- **Users / Vendors / Categories** — manage platform data.
- **Monitoring** — live booking feed, transactions, fraud alerts (mock).
- **Settings** — maintenance mode, platform config.

---

## Run the demo

```bash
cd Marketplace
npm run dev
```

Open **http://localhost:5173**

All demo accounts use password: **`password123`**

---

## Test 1 — Customer books a service (~2 min)

1. Go to **Login** → click the **customer** quick-login button.
2. Open **Marketplace** from the sidebar.
3. Pick any service → **Book Now**.
4. Complete the booking wizard (date, package, address, payment).
5. Go to **My Bookings** → open **Track** on your new booking.

**Show:** Search/filters on marketplace, booking flow, live tracking map + status timeline.

---

## Test 2 — Vendor manages bookings (~2 min)

1. **Logout** → login as **vendor** (quick-login button).
2. Open **Bookings** → accept a pending booking and change its status.
3. Open **Kanban** → move a card to another column.
4. Skim **Analytics** for revenue charts.

**Show:** Vendor workflow, status updates, Kanban board, analytics dashboard.

---

## Test 3 — Admin verifies a vendor (~1 min)

1. **Logout** → login as **admin**.
2. Go to **Verification** → pick a pending vendor.
3. **Approve** or **Reject** with an admin note.
4. Check **Dashboard** activity feed for the update.

**Show:** Platform oversight, vendor verification, admin KPIs.

---

## Test 4 — App shell & polish (~1 min)

While logged in as any role:

1. Press **`⌘K`** (or **Ctrl+K**) → jump to another page via command palette.
2. Click the **bell icon** → notifications dropdown.
3. Toggle **dark/light mode** (sun/moon icon in navbar).

**Show:** Production-style UX — command menu, notifications, theme toggle.

---

## Test 5 — Data persists (~30 sec)

1. Create a booking or change a setting while logged in.
2. **Refresh the browser**.
3. Confirm your session and data are still there.

**Show:** LocalStorage persistence — no backend required.

---

## Reset demo data

If the app state gets messy:

- **Admin → Settings** → reset option, or
- Clear browser LocalStorage for the site and refresh.

---

## Demo accounts

| Role     | Email                  |
|----------|------------------------|
| Customer | `customer@example.com` |
| Vendor   | `vendor@example.com`   |
| Admin    | `admin@example.com`    |

Password for all: **`password123`**
