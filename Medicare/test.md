# MediCare+ — Demo Script

## What is MediCare+?

MediCare+ is a **healthcare management and telemedicine platform** for clinics and virtual care providers. Patients book appointments and attend online consultations. Doctors manage schedules, write prescriptions, and review medical records. Receptionists handle check-ins and billing. Admins operate the platform.

This demo is **frontend-only** (no real backend). All data is mocked and saved in the browser.

---

## Doctor specialties

| Specialty | Common services |
|-----------|-----------------|
| General Practitioner | Check-ups, general illness |
| Cardiologist | Heart health, ECG review |
| Dermatologist | Skin conditions, rashes |
| Neurologist | Headaches, nerve issues |
| Dentist | Dental exams, cleaning |
| Pediatrician | Child health, vaccinations |
| Psychiatrist | Mental health consultations |

---

## How patients use it

1. **Search** doctors by specialty and mode (online or in-clinic).
2. **Book** an appointment — pick date, time slot, and reason for visit.
3. **Attend** teleconsultation — video lobby with chat and file upload (mock).
4. **Receive** prescriptions and view them in the Prescriptions module.
5. **Track** health metrics — heart rate, blood pressure, weight, etc.
6. **Message** doctors securely through the messaging center.

**Appointment lifecycle:**

```
Pending → Confirmed → Waiting → In Consultation → Completed
                                              ↘ Cancelled
```

---

## How doctors register

Doctors join in **three stages**: sign up → build profile → admin approval.

### Stage 1 — Sign up

**Where:** `/auth/register` → choose **Doctor** role → OTP verification → login.

Creates a **doctor user account** and an linked **doctor profile** (verification status: pending).

**Demo shortcut:** `doctor@example.com` / `password123` — pre-approved GP profile.

### Stage 2 — Doctor profile

**Where:** Doctor sidebar → **Settings**, **Availability**

Set specialty, fees, weekly schedule, emergency availability.

### Stage 3 — Admin verification

**Where:** Admin → **Doctor Verification**

Admin reviews license (mock) and approves/rejects. Approved doctors can receive appointments.

**Pre-loaded doctors:** 20 doctor profiles seeded for browsing and booking. Demo login maps to the main GP account.

```
/auth/register (Doctor) → Login → Settings / Availability
                                    ↓
                          Admin /admin/verification
                                    ↓
                          Approved → accept appointments
```

---

## Business logic (brief)

| Flow | What happens |
|------|--------------|
| **Patient booking** | Search doctor → pick slot → confirm → appointment pending/confirmed |
| **Check-in** | Receptionist moves appointment to **Waiting** with queue position |
| **Consultation** | Doctor opens workspace → symptoms, diagnosis, prescription → **Completed** |
| **Teleconsultation** | Online appointments open video lobby mock with chat |
| **Prescriptions** | Doctor CRUD; patient views, downloads PDF mock, refill reminders |
| **Billing** | Invoices with insurance split; receptionist marks paid |
| **Verification** | Admin approves doctors before they go live |

---

## Dashboards — who uses what?

### Patient (`/patient`)
- Dashboard, book appointment, appointments list, teleconsultation
- Prescriptions, medical records, health metrics
- Messages, notifications, profile, settings

### Doctor (`/doctor`)
- Dashboard, appointments, consultation workspace
- Patients, prescriptions, availability, analytics, messages

### Receptionist (`/receptionist`)
- Dashboard, patient registration, scheduling, queue, billing

### Admin (`/admin`)
- Dashboard, doctor verification, clinic management
- Users, monitoring, notifications, settings (reset demo data)

---

## Run the demo

```bash
cd Medicare
npm install
npm run dev
```

Open **http://localhost:5173**

Password for all demo accounts: **`password123`**

---

## Test 1 — Patient books & teleconsult (~2 min)

1. Login → click **patient** quick-login.
2. **Book Appointment** → filter by specialty → pick online mode → select slot → confirm.
3. Go to **Appointments** → open **Teleconsult lobby** on an online visit.

**Show:** Doctor search, booking wizard, video consultation mock.

---

## Test 2 — Doctor consultation & prescription (~2 min)

1. Logout → login as **doctor**.
2. **Appointments** → accept pending → start consultation workspace.
3. Enter symptoms/diagnosis → add prescription → complete visit.
4. Check **Analytics** for charts.

**Show:** Consultation workspace, prescription CRUD, clinical analytics.

---

## Test 3 — Receptionist queue (~1 min)

1. Logout → login as **receptionist**.
2. **Queue** → check in a patient → update status.
3. **Scheduling** → book walk-in appointment.

**Show:** Live queue, check-in flow, front-desk scheduling.

---

## Test 4 — Admin verification & clinics (~1 min)

1. Logout → login as **admin**.
2. **Doctor Verification** → approve a pending doctor.
3. **Clinic Management** → view/edit clinics and departments.

**Show:** Platform oversight, verification workflow, clinic CRUD.

---

## Test 5 — App shell & persistence (~1 min)

1. Press **⌘K** → navigate via command palette.
2. Open notifications bell → mark read.
3. Visit the **landing page** at `/` — note the classic corporate website design.
4. Refresh browser — session and data persist.

**Show:** Material Design dashboard shell, classic public website, LocalStorage persistence.

---

## Reset demo data

- **Admin → Settings** → Reset demo data, or
- Clear browser LocalStorage and refresh.

---

## Demo accounts

| Role | Email |
|------|-------|
| Patient | `patient@example.com` |
| Doctor | `doctor@example.com` |
| Receptionist | `receptionist@example.com` |
| Admin | `admin@example.com` |

Password: **`password123`**
