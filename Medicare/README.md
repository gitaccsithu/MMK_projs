# MediCare+ — Healthcare Management & Telemedicine Platform

A portfolio-quality, frontend-only healthcare SaaS demo for clinics and telemedicine providers. Features role-based dashboards, appointment scheduling, teleconsultation UI, prescriptions, billing, secure messaging, and analytics — all without a backend.

## Quick Start

```bash
cd Medicare
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

| Role | Email | Password |
|------|-------|----------|
| Patient | `patient@example.com` | `password123` |
| Doctor | `doctor@example.com` | `password123` |
| Receptionist | `receptionist@example.com` | `password123` |
| Admin | `admin@example.com` | `password123` |

## Business Logic

### Platform Overview

MediCare+ connects **patients**, **doctors**, **receptionists**, and **admins** in a unified healthcare workflow:

- Patients book appointments and attend teleconsultations
- Doctors manage schedules, consultations, and prescriptions
- Receptionists handle check-ins, queue, and front-desk billing
- Admins oversee clinics, doctor verification, and platform analytics

### Appointment Lifecycle

```
Pending → Confirmed → Waiting → In Consultation → Completed
                                              ↘ Cancelled
```

Modes: **online** (teleconsultation), **clinic** (in-person), **emergency**, **followup**

### Doctor Verification

Doctors register → complete profile → admin approves at **Admin → Doctor Verification** → doctor becomes active.

### Prescriptions & Billing

Doctors create prescriptions in the consultation workspace. Invoices track insurance claims and patient co-pay. Receptionists process payments at the front desk.

### Data Persistence

All data stored in **LocalStorage** under `medicare:` namespace. Seed data includes 50 patients, 20 doctors, 100 appointments, 200 notifications, 100 prescriptions.

Reset via **Admin → Settings** or clear LocalStorage and refresh.

## Design System

MediCare+ uses a distinct visual identity from typical Tailwind/shadcn apps:

| Area | Design |
|------|--------|
| **Public website** | Classic pre-Tailwind corporate layout — fixed 960px width, solid teal header, boxed sections, Arial/Helvetica typography |
| **Auth & dashboards** | Google Material Design via MUI — AppBar + permanent drawer shell, teal/blue-grey palette, elevation cards, data tables |

**Primary colors:** Teal `#00796B`, AppBar `#004D40`, Secondary `#455A64`

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| UI (dashboards) | MUI Material Design v6 |
| UI (public site) | Classic CSS |
| Routing | React Router 7 |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Persistence | LocalStorage |
| PWA | vite-plugin-pwa |

## Project Structure

```
src/
├── components/layout/   # Shell, search, AI assistant
├── components/shared/   # PageHeader, EmptyState, StatusBadge
├── components/charts/   # Recharts card wrappers
├── pages/patient|doctor|receptionist|admin|auth|public/
├── layouts/             # Dashboard (MUI), Auth (MUI), Public (classic CSS)
├── theme/               # MUI theme configuration
├── styles/              # Classic public website CSS
├── store/               # auth, app, settings
├── services/            # mockApi, storage, simulation
├── types/               # Domain models
└── data/                # Seed + demo accounts
```

## Feature Highlights

- 4 role dashboards with Material Design teal theme
- Classic corporate marketing website (landing, FAQ, help, legal pages)
- Appointment booking with specialty filters and slot picker
- Teleconsultation mock (video, chat, controls)
- Prescription CRUD with drug interaction warnings
- Queue management for receptionists
- Doctor verification and clinic CRUD for admins
- Health metrics charts, medical records, secure messaging
- Cmd+K command palette, global search, notifications
- PWA support

## License

Demo project for portfolio showcase. Not for production medical use.
