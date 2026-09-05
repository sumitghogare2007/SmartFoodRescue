# SmartFoodRescue — Implementation Plan

**Version:** 1.0 | **Date:** 2026-08-28  
**Supabase Project:** `scnppygzlufydlsfayoj` (SmartFoodRescue Project) — ACTIVE_HEALTHY  
**Region:** ap-southeast-2  

---

## Background

SmartFoodRescue is a full-stack food rescue platform (React + Vite + Tailwind + Supabase) for a DBMS academic project. The Supabase project is already created and healthy. All database work will be executed via the Supabase MCP. The frontend will be built in `d:\SmartF\`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v3 (glassmorphism) |
| Icons | Lucide React |
| Charts | Recharts |
| Routing | React Router v6 |
| State | React Context + hooks |
| Backend/DB | Supabase (PostgreSQL 17) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (avatars) |
| Env | `.env` file with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |

---

## Open Questions

> [!IMPORTANT]
> Please review these questions before approving the plan:

1. **Volunteer Task Assignment:** Should volunteers self-assign pickups from a pool, OR should the admin/donor assign a specific volunteer? *(Plan assumes: volunteers self-assign from available tasks pool; admin can also assign)*
2. **NGO Request Approval:** Should a donor manually approve an NGO's request, OR should the first-accepted NGO automatically get the donation? *(Plan assumes: donor manually accepts/rejects each request)*
3. **Demo Data Users:** Should demo donors/NGOs/volunteers be real Supabase Auth users (so you can log in as them), OR just database records with dummy auth IDs? *(Plan assumes: realistic seed records only, not actual Auth users, since creating Auth users needs service-role key which can't be used in frontend)*
4. **Pickup Assignment Flow:** After a donor accepts an NGO request, does a pickup record get auto-created waiting for a volunteer, OR does a volunteer proactively browse and accept? *(Plan assumes: pickup record created automatically; volunteers browse and accept)*

---

## User Review Required

> [!WARNING]
> The `VITE_SUPABASE_ANON_KEY` and `VITE_SUPABASE_URL` must be provided in a `.env` file at `d:\SmartF\.env`. These will NOT be hard-coded in source code. You will need to provide these values; they can be found in the Supabase dashboard under Project Settings → API.

> [!NOTE]
> Admin accounts: The first registered user with role 'admin' will have full access. Admin role cannot be selected during public registration (it will be set manually in the database or via a protected admin invite flow).

---

## Proposed Changes

### Phase 1 — Project Scaffold

#### [NEW] Project root files
- `d:\SmartF\package.json` — Vite + React + TypeScript + Tailwind + Recharts + Lucide
- `d:\SmartF\vite.config.ts`
- `d:\SmartF\tsconfig.json`
- `d:\SmartF\tailwind.config.js` — extended with glassmorphism utilities
- `d:\SmartF\postcss.config.js`
- `d:\SmartF\.env` — `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (values from dashboard)
- `d:\SmartF\.env.example` — template with empty values
- `d:\SmartF\.gitignore` — includes `.env`
- `d:\SmartF\index.html`

---

### Phase 2 — Database Migrations (via Supabase MCP)

All executed against project `scnppygzlufydlsfayoj` using `apply_migration`.

#### Migration 001 — Core Tables
Creates: `profiles`, `donors`, `ngos`, `volunteers`, `food_categories`

#### Migration 002 — Donation Tables
Creates: `food_donations`, `ngo_requirements`, `donation_requests`

#### Migration 003 — Logistics Tables
Creates: `pickups`, `distributions`, `beneficiaries`, `distribution_beneficiaries`

#### Migration 004 — Feedback & Notifications
Creates: `feedback`, `notifications`, `audit_logs`

#### Migration 005 — Indexes
```sql
CREATE INDEX idx_food_donations_status ON food_donations(status);
CREATE INDEX idx_food_donations_expiry ON food_donations(expiry_time);
CREATE INDEX idx_food_donations_donor ON food_donations(donor_id);
CREATE INDEX idx_donation_requests_donation ON donation_requests(donation_id);
CREATE INDEX idx_pickups_volunteer ON pickups(volunteer_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

#### Migration 006 — Functions & Triggers
```sql
-- updated_at trigger function
-- handle_new_user() function + trigger on auth.users
-- calculate_expiry_urgency(ts TIMESTAMPTZ) RETURNS TEXT
-- get_impact_stats() RETURNS TABLE
-- accept_donation_request(request_id UUID) RETURNS VOID (transactional)
-- expire_old_donations() RETURNS INTEGER
-- Audit log triggers for food_donations
-- Notification triggers for donation_requests, pickups
```

#### Migration 007 — Views
```sql
-- v_active_donations
-- v_impact_summary
-- v_volunteer_performance
-- v_ngo_activity
-- v_donor_stats
```

#### Migration 008 — RLS Policies
Enable RLS on all tables and add policies per the design document.

#### Migration 009 — Seed Data
Inserts realistic demo data:
- 8 food categories
- 4 donor profiles + donor records
- 4 NGO profiles + ngo records
- 8 volunteer profiles + volunteer records
- 10 NGO requirements
- 15 food donations (varied status, category, expiry)
- Donation requests, pickups, distributions, feedback, beneficiaries

---

### Phase 3 — Supabase Client & Types

#### [NEW] `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### [NEW] `src/types/index.ts`
Full TypeScript types for all 15 tables.

---

### Phase 4 — Authentication

#### [NEW] `src/context/AuthContext.tsx`
- `useSession()`, `useUser()`, `useProfile()`, `useRole()`
- On login: fetch user profile and role
- Provide `login()`, `register()`, `logout()`, `updateProfile()`

#### [NEW] `src/components/auth/ProtectedRoute.tsx`
- Redirects unauthenticated users to `/auth/login`
- Checks role for role-restricted routes

#### [NEW] Pages:
- `src/pages/auth/Login.tsx` — Glassmorphism login form
- `src/pages/auth/Register.tsx` — Register with role selection (Donor/NGO/Volunteer)
- `src/pages/auth/ForgotPassword.tsx`

#### Registration Flow:
1. User fills form, selects role
2. `supabase.auth.signUp()` called
3. `handle_new_user()` trigger fires → creates `profiles` record
4. Frontend detects role → creates `donors`/`ngos`/`volunteers` record with additional info
5. Redirect to role dashboard

---

### Phase 5 — Core Features

#### 5.1 Donation Management (Donor)

##### [NEW] `src/services/donationService.ts`
- `createDonation()`, `updateDonation()`, `cancelDonation()`
- `getDonationsByDonor()`, `getDonationById()`
- `getDonationRequests()`, `acceptRequest()`, `rejectRequest()`

##### [NEW] `src/pages/donations/NewDonation.tsx`
Full form: food name, category dropdown, quantity, servings, expiry datetime, pickup address, storage type, food condition, description. Validates all fields. Submits to Supabase.

##### [NEW] `src/components/donations/DonationCard.tsx`
Glass card showing: food emoji, name, servings, donor, city, expiry countdown, status badge, urgency badge. Action buttons: View Details, Request Food.

##### [NEW] `src/components/donations/ExpiryBadge.tsx`
Real-time countdown using `useEffect` + `setInterval`. Color-coded: Fresh/Expiring Soon/Urgent/Expired.

##### [NEW] `src/components/donations/DonationTimeline.tsx`
Visual vertical timeline of the donation lifecycle with checkmarks, timestamps, and animated current step.

##### [NEW] `src/components/donations/DonationFilters.tsx`
Filter panel: category, city, status, urgency, donor type, quantity range. Sort: expiring soon, newest, largest.

#### 5.2 NGO Features

##### [NEW] `src/services/ngoService.ts`
- `getAvailableDonations()`, `requestDonation()`, `cancelRequest()`
- `createRequirement()`, `getMyRequirements()`
- `getMyPickups()`, `recordDistribution()`
- `submitFeedback()`

##### [NEW] `src/pages/donations/DonationsPage.tsx`
Public/NGO donations browse page with filters, search, and sorted donation cards.

##### [NEW] `src/algorithms/ngoMatcher.ts`
Rule-based scoring algorithm. Input: donation + list of NGOs with requirements. Output: sorted list with scores and match breakdown.

##### [NEW] `src/components/ngo/NGOMatchCard.tsx`
Glass card showing NGO name, match %, distance, match factors (✓/✗), capacity, action button.

##### [NEW] `src/pages/requirements/RequirementsPage.tsx`
NGO can view and create food requirements.

##### [NEW] `src/components/ngo/DistributionForm.tsx`
Form to record distribution: quantity distributed, servings, people served, location, beneficiary groups, notes.

#### 5.3 Volunteer Features

##### [NEW] `src/services/volunteerService.ts`
- `getAvailablePickups()`, `acceptPickup()`
- `updatePickupStatus()` — On The Way / Picked Up / Delivered

##### [NEW] `src/components/volunteer/PickupCard.tsx`
Shows: donation name, pickup address, delivery address, NGO name, scheduled time, status. Action buttons for status updates.

---

### Phase 6 — Dashboards

#### [NEW] `src/components/dashboard/StatCard.tsx`
Reusable glass stat card: icon, label, value, trend indicator.

#### [NEW] `src/pages/dashboard/AdminDashboard.tsx`
- Stats: total donors, NGOs, volunteers, donations, meals rescued, people served
- Charts: donations by month (line), by category (pie/donut), by donor type (bar)
- Tables: pending verifications, expiring donations, recent activity

#### [NEW] `src/pages/dashboard/DonorDashboard.tsx`
- Stats: total/active/completed donations, meals rescued
- Expiring donations alert list
- Recent donations with status
- Quick action: Add Donation

#### [NEW] `src/pages/dashboard/NGODashboard.tsx`
- Stats: available donations nearby, pending pickups, total distributions, people served
- Available donations list (with match scores where possible)
- Active pickups tracker
- Quick actions: Browse Donations, Post Requirement

#### [NEW] `src/pages/dashboard/VolunteerDashboard.tsx`
- Stats: available tasks, assigned pickups, completed pickups
- Today's tasks list
- Active pickup with status updater
- History table

#### Charts implemented with Recharts:
- `DonationTrendChart` — AreaChart by month
- `CategoryBreakdownChart` — PieChart/DonutChart
- `DonorTypeChart` — BarChart
- `ImpactChart` — Combined stats over time

---

### Phase 7 — Public Landing Page

#### [NEW] `src/pages/Landing.tsx`
Sections:
1. **Hero** — Animated gradient headline "Rescue Food. Feed People. Reduce Waste." + animated counter stats + 3 CTA buttons
2. **How It Works** — 3-step cards for Donor, NGO, Volunteer
3. **Impact Stats** — Animated counters: Meals Rescued, Donations, NGOs, People Served (pulled from `v_impact_summary` + demo seed data)
4. **For Donors / NGOs / Volunteers** — Feature lists in glass cards
5. **CTA** — Register / Join buttons
6. **Footer**

#### [NEW] `src/components/landing/AnimatedCounter.tsx`
Counts up from 0 to target value when scrolled into view (Intersection Observer).

---

### Phase 8 — Layout & UI

#### [NEW] `src/components/layout/AppLayout.tsx`
Sidebar + Topbar layout for authenticated users.

#### [NEW] `src/components/layout/Sidebar.tsx`
Role-based navigation links. Active link highlighted with green accent.

#### [NEW] `src/components/layout/Navbar.tsx`
Logo, notifications bell with badge, user avatar menu.

#### [NEW] `src/components/ui/GlassCard.tsx`
Reusable glass card wrapper with optional elevated/stat variants.

#### [NEW] `src/components/ui/Toast.tsx`
Top-right success/error/info toasts using a `NotificationContext`.

#### [NEW] `src/App.tsx`
React Router setup with role-based route protection.

---

## Verification Plan

### Automated / Scripted
- Supabase MCP: verify all 15 tables exist with `list_tables`
- Supabase MCP: verify views exist with `execute_sql` querying `information_schema.views`
- Supabase MCP: verify RLS is enabled on all tables
- Run `npm run build` to verify zero TypeScript errors

### Manual Workflow Tests (post-build)
1. **Registration:** Register as Donor → verify profile + donor record created in DB
2. **Login:** Login as donor → redirect to donor dashboard
3. **Create Donation:** Fill form → verify record in `food_donations` table
4. **NGO Browse:** Login as NGO → browse donations → request one
5. **Donor Accept:** Login as donor → accept NGO request → verify status change
6. **Volunteer Pickup:** Login as volunteer → accept task → update status to Delivered
7. **Distribution:** Login as NGO → record distribution → verify `distributions` record
8. **Feedback:** NGO submits feedback → verify `feedback` record
9. **Dashboard:** Each role dashboard loads with real data
10. **Expiry Badge:** Create a donation expiring in 30 mins → verify URGENT badge
11. **NGO Match:** Post requirement → view a donation → verify match scores shown
12. **Audit Log:** Verify `audit_logs` rows created for above actions
13. **RLS:** Try accessing another user's data → verify 403/empty response

---

## Development Order

```
Phase 1:  Scaffold & Environment Setup        (~1h)
Phase 2:  Database Migrations (MCP)           (~2h)
Phase 3:  Auth System                         (~1.5h)
Phase 4:  Core Donation CRUD (Donor)          (~2h)
Phase 5:  NGO Features + Matching             (~2h)
Phase 6:  Volunteer Features                  (~1h)
Phase 7:  Dashboards + Charts                 (~2h)
Phase 8:  Landing Page                        (~1.5h)
Phase 9:  UI Polish + Testing                 (~1h)
Total estimated: ~14h
```
