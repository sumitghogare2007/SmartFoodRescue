# SmartFoodRescue — Design Document

**Version:** 1.0 | **Date:** 2026-08-28

---

## 1. Visual Identity

### 1.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#0A0F1E` | Main dark background |
| `bg-secondary` | `#0D1528` | Card / section backgrounds |
| `accent-green` | `#10B981` | Primary CTA, success, icons |
| `accent-teal` | `#14B8A6` | Secondary accent, charts |
| `glass-white` | `rgba(255,255,255,0.05)` | Glass card background |
| `glass-border` | `rgba(255,255,255,0.10)` | Glass card border |
| `text-primary` | `#F1F5F9` | Primary text |
| `text-muted` | `#94A3B8` | Muted text |
| `urgent-red` | `#EF4444` | Urgent/expired states |
| `warning-amber` | `#F59E0B` | Expiring soon |
| `fresh-green` | `#10B981` | Fresh food state |

### 1.2 Glassmorphism CSS System

```css
/* Standard glass card */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
}

/* Elevated glass (modals, hero) */
.glass-elevated {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

/* Stat card with gradient accent */
.glass-stat {
  background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(20,184,166,0.05));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(16,185,129,0.25);
}
```

### 1.3 Urgency Color System

| State | Time Remaining | Style |
|-------|---------------|-------|
| Fresh | > 4h | `bg-green-500/20 text-green-400 border-green-500/30` |
| Expiring Soon | 1–4h | `bg-amber-500/20 text-amber-400 border-amber-500/30` |
| Urgent | < 1h | `bg-red-500/20 text-red-400 border-red-500/30 animate-pulse` |
| Expired | Past | `bg-gray-500/20 text-gray-400 line-through` |

---

## 2. Application Page Map

```
/ (Landing Page)
├── /auth/login
├── /auth/register
├── /auth/forgot-password
├── /dashboard               → redirects by role
│   ├── /dashboard/admin
│   ├── /dashboard/donor
│   ├── /dashboard/ngo
│   └── /dashboard/volunteer
├── /donations
│   ├── /donations/new
│   ├── /donations/:id
│   └── /donations/:id/edit
├── /requirements
│   ├── /requirements/new
│   └── /requirements/:id
├── /pickups/:id
├── /distributions/new
├── /profile
└── /admin/*                 → admin-only routes
```

---

## 3. Component Architecture

### 3.1 Directory Structure

```
src/
├── components/
│   ├── ui/                    # Base UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Spinner.tsx
│   │   ├── EmptyState.tsx
│   │   └── GlassCard.tsx
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── LandingLayout.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── charts/
│   │   ├── DonationTrendChart.tsx
│   │   ├── CategoryBreakdownChart.tsx
│   │   └── ImpactChart.tsx
│   ├── donations/
│   │   ├── DonationCard.tsx
│   │   ├── DonationForm.tsx
│   │   ├── DonationFilters.tsx
│   │   ├── DonationStatusBadge.tsx
│   │   ├── DonationTimeline.tsx
│   │   ├── ExpiryBadge.tsx
│   │   └── DonationList.tsx
│   ├── ngo/
│   │   ├── NGOCard.tsx
│   │   ├── NGOMatchCard.tsx
│   │   ├── RequirementCard.tsx
│   │   ├── RequirementForm.tsx
│   │   └── DistributionForm.tsx
│   ├── volunteer/
│   │   ├── PickupCard.tsx
│   │   └── TaskStatusUpdater.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── ActivityFeed.tsx
│   │   └── ExpiringDonations.tsx
│   └── auth/
│       ├── LoginForm.tsx
│       ├── RegisterForm.tsx
│       └── ProtectedRoute.tsx
├── pages/
│   ├── Landing.tsx
│   ├── auth/{Login,Register,ForgotPassword}.tsx
│   ├── dashboard/{Admin,Donor,NGO,Volunteer}Dashboard.tsx
│   ├── donations/{DonationsPage,NewDonation,DonationDetail}.tsx
│   ├── requirements/RequirementsPage.tsx
│   ├── pickups/PickupsPage.tsx
│   └── Profile.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useDonations.ts
│   ├── useNGOMatch.ts
│   ├── usePickups.ts
│   └── useNotifications.ts
├── lib/
│   ├── supabase.ts            # Supabase client (uses env vars)
│   └── utils.ts
├── services/
│   ├── authService.ts
│   ├── donationService.ts
│   ├── ngoService.ts
│   ├── volunteerService.ts
│   ├── pickupService.ts
│   └── distributionService.ts
├── algorithms/
│   └── ngoMatcher.ts          # Scoring algorithm
├── context/
│   ├── AuthContext.tsx
│   └── NotificationContext.tsx
└── types/index.ts
```

---

## 4. Database Schema (DDL)

### profiles
```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  phone       TEXT,
  role        TEXT NOT NULL CHECK (role IN ('admin','donor','ngo','volunteer')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

### donors
```sql
CREATE TABLE donors (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  organization_name   TEXT NOT NULL,
  donor_type          TEXT NOT NULL CHECK (donor_type IN ('Restaurant','Hotel','College','Event','Supermarket','Household','Other')),
  address             TEXT NOT NULL,
  city                TEXT NOT NULL,
  latitude            DECIMAL(9,6),
  longitude           DECIMAL(9,6),
  verification_status TEXT NOT NULL DEFAULT 'Pending' CHECK (verification_status IN ('Pending','Verified','Rejected')),
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

### ngos
```sql
CREATE TABLE ngos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  ngo_name            TEXT NOT NULL,
  registration_number TEXT UNIQUE,
  contact_person      TEXT NOT NULL,
  phone               TEXT NOT NULL,
  email               TEXT NOT NULL,
  address             TEXT NOT NULL,
  city                TEXT NOT NULL,
  latitude            DECIMAL(9,6),
  longitude           DECIMAL(9,6),
  capacity            INTEGER NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'Pending' CHECK (verification_status IN ('Pending','Verified','Rejected')),
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

### volunteers
```sql
CREATE TABLE volunteers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  availability_status TEXT NOT NULL DEFAULT 'Available' CHECK (availability_status IN ('Available','Busy','Offline')),
  current_location    TEXT,
  latitude            DECIMAL(9,6),
  longitude           DECIMAL(9,6),
  vehicle_type        TEXT NOT NULL DEFAULT 'None' CHECK (vehicle_type IN ('Bicycle','Bike','Car','Van','None')),
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

### food_categories
```sql
CREATE TABLE food_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### food_donations
```sql
CREATE TABLE food_donations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id          UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  food_category_id  UUID NOT NULL REFERENCES food_categories(id),
  food_name         TEXT NOT NULL,
  description       TEXT,
  quantity          DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  quantity_unit     TEXT NOT NULL DEFAULT 'kg',
  servings          INTEGER NOT NULL CHECK (servings > 0),
  preparation_time  TIMESTAMPTZ,
  expiry_time       TIMESTAMPTZ NOT NULL,
  pickup_deadline   TIMESTAMPTZ NOT NULL,
  storage_type      TEXT NOT NULL DEFAULT 'Room Temperature'
                    CHECK (storage_type IN ('Room Temperature','Refrigerated','Frozen','Dry Storage')),
  food_condition    TEXT NOT NULL DEFAULT 'Freshly Prepared'
                    CHECK (food_condition IN ('Freshly Prepared','Day Old','Sealed/Packaged','Cooked')),
  pickup_address    TEXT NOT NULL,
  pickup_latitude   DECIMAL(9,6),
  pickup_longitude  DECIMAL(9,6),
  status            TEXT NOT NULL DEFAULT 'Available'
                    CHECK (status IN ('Available','Requested','Accepted','Assigned','Picked Up','Delivered','Distributed','Expired','Cancelled')),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
```

### ngo_requirements
```sql
CREATE TABLE ngo_requirements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id            UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  food_category_id  UUID REFERENCES food_categories(id),
  food_name         TEXT,
  required_quantity DECIMAL(10,2) NOT NULL CHECK (required_quantity > 0),
  quantity_unit     TEXT NOT NULL DEFAULT 'kg',
  required_servings INTEGER NOT NULL CHECK (required_servings > 0),
  urgency           TEXT NOT NULL DEFAULT 'Medium'
                    CHECK (urgency IN ('Low','Medium','High','Critical')),
  required_by       TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'Open'
                    CHECK (status IN ('Open','Partially Fulfilled','Fulfilled','Cancelled')),
  created_at        TIMESTAMPTZ DEFAULT now()
);
```

### donation_requests
```sql
CREATE TABLE donation_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id        UUID NOT NULL REFERENCES food_donations(id) ON DELETE CASCADE,
  ngo_id             UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  requested_quantity DECIMAL(10,2),
  message            TEXT,
  status             TEXT NOT NULL DEFAULT 'Pending'
                     CHECK (status IN ('Pending','Accepted','Rejected','Cancelled')),
  requested_at       TIMESTAMPTZ DEFAULT now(),
  responded_at       TIMESTAMPTZ,
  UNIQUE (donation_id, ngo_id)
);
```

### pickups
```sql
CREATE TABLE pickups (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id           UUID NOT NULL REFERENCES food_donations(id) ON DELETE CASCADE,
  ngo_id                UUID NOT NULL REFERENCES ngos(id),
  volunteer_id          UUID REFERENCES volunteers(id),
  pickup_address        TEXT NOT NULL,
  delivery_address      TEXT NOT NULL,
  scheduled_pickup_time TIMESTAMPTZ,
  actual_pickup_time    TIMESTAMPTZ,
  actual_delivery_time  TIMESTAMPTZ,
  pickup_status         TEXT NOT NULL DEFAULT 'Pending'
                        CHECK (pickup_status IN ('Pending','Assigned','On The Way','Picked Up','Delivered','Failed','Cancelled')),
  delivery_status       TEXT NOT NULL DEFAULT 'Pending'
                        CHECK (delivery_status IN ('Pending','In Transit','Delivered','Failed')),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);
```

### distributions
```sql
CREATE TABLE distributions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id            UUID NOT NULL REFERENCES food_donations(id),
  ngo_id                 UUID NOT NULL REFERENCES ngos(id),
  quantity_distributed   DECIMAL(10,2) NOT NULL CHECK (quantity_distributed > 0),
  servings_distributed   INTEGER NOT NULL CHECK (servings_distributed > 0),
  people_served          INTEGER NOT NULL CHECK (people_served > 0),
  distribution_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  distribution_location  TEXT NOT NULL,
  notes                  TEXT,
  created_at             TIMESTAMPTZ DEFAULT now()
);
```

### beneficiaries
```sql
CREATE TABLE beneficiaries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id           UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  group_name       TEXT NOT NULL,
  location         TEXT NOT NULL,
  people_count     INTEGER NOT NULL CHECK (people_count > 0),
  beneficiary_type TEXT NOT NULL
                   CHECK (beneficiary_type IN ('Children','Elderly','Homeless','Low Income Families','Community','Other')),
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

### distribution_beneficiaries
```sql
CREATE TABLE distribution_beneficiaries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID NOT NULL REFERENCES distributions(id) ON DELETE CASCADE,
  beneficiary_id  UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  people_served   INTEGER NOT NULL CHECK (people_served > 0),
  UNIQUE (distribution_id, beneficiary_id)
);
```

### feedback
```sql
CREATE TABLE feedback (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id          UUID NOT NULL REFERENCES food_donations(id),
  ngo_id               UUID NOT NULL REFERENCES ngos(id),
  rating               INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  food_quality_rating  INTEGER NOT NULL CHECK (food_quality_rating BETWEEN 1 AND 5),
  delivery_rating      INTEGER NOT NULL CHECK (delivery_rating BETWEEN 1 AND 5),
  comment              TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE (donation_id, ngo_id)
);
```

### notifications
```sql
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('donation','request','pickup','distribution','system','alert')),
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### audit_logs
```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. NGO Matching Algorithm

### Scoring Weights

| Factor | Weight | Description |
|--------|--------|-------------|
| Category Match | 30% | NGO requirement matches donation category |
| Quantity Match | 25% | Available servings meet NGO requirement |
| Proximity | 20% | Distance NGO ↔ pickup location |
| Urgency Match | 15% | NGO urgency vs donation expiry |
| Capacity | 10% | NGO can handle the quantity |

### TypeScript Pseudocode

```typescript
function calculateMatchScore(donation: FoodDonation, ngo: NGOWithRequirements) {
  let score = 0;

  // Category match (30 pts)
  const catMatch = ngo.requirements.some(r => r.food_category_id === donation.food_category_id);
  if (catMatch) score += 30;

  // Quantity match (25 pts)
  const req = ngo.requirements.find(r => r.food_category_id === donation.food_category_id);
  if (req) {
    const ratio = donation.servings / req.required_servings;
    score += Math.min(25, Math.round(ratio * 25));
  }

  // Proximity (20 pts)
  const km = haversineDistance(ngo.lat, ngo.lng, donation.pickup_lat, donation.pickup_lng);
  if (km <= 2) score += 20;
  else if (km <= 5) score += 15;
  else if (km <= 10) score += 10;
  else if (km <= 20) score += 5;

  // Urgency (15 pts)
  const minsLeft = (new Date(donation.expiry_time).getTime() - Date.now()) / 60000;
  if (minsLeft < 60 && req?.urgency === 'Critical') score += 15;
  else if (minsLeft < 240 && ['High','Critical'].includes(req?.urgency)) score += 10;
  else score += 5;

  // Capacity (10 pts)
  if (ngo.capacity >= donation.servings) score += 10;

  return { ngo, score, km };
}
```

---

## 6. Key UI Wireframes

### Donation Card
```
┌─────────────────────────────────────────┐
│ 🍱  Biryani                [URGENT] ⏱   │
│     100 Meals                           │
│     ABC Restaurant · 📍 Pune            │
│  Category: Main Course                  │
│  Expires in: 45 minutes                 │
│  Pickup by: 10:30 PM                    │
│  [View Details]        [Request Food]   │
└─────────────────────────────────────────┘
```

### Food Journey Timeline
```
✅ Donation Created       [2:00 PM, Aug 28]
|
✅ NGO Requested          [2:15 PM, Aug 28]
|
✅ Request Accepted       [2:30 PM, Aug 28]
|
✅ Volunteer Assigned     [2:35 PM, Aug 28]
|
🔄 Food Picked Up         [In Progress...]
|
○  Delivered              [Pending]
|
○  Distributed            [Pending]
```

### NGO Match Card
```
┌─────────────────────────────────────┐
│  Hope Foundation           94% ●    │
│  2.4 km away                        │
│  ✓ Food Category Match              │
│  ✓ Quantity (80 meals needed)       │
│  ✓ Location Nearby                  │
│  ⚠ High Urgency Requirement         │
│  Capacity: 200 meals                │
│  [Assign to this NGO]               │
└─────────────────────────────────────┘
```

---

## 7. Database Views

```sql
-- Active donations with donor and category
CREATE VIEW v_active_donations AS
SELECT fd.*, d.organization_name, d.donor_type, d.city, fc.name AS category_name
FROM food_donations fd
JOIN donors d ON fd.donor_id = d.id
JOIN food_categories fc ON fd.food_category_id = fc.id
WHERE fd.status NOT IN ('Expired','Cancelled','Distributed');

-- Impact summary
CREATE VIEW v_impact_summary AS
SELECT
  COUNT(DISTINCT fd.id)          AS total_donations,
  SUM(dist.servings_distributed) AS total_meals_rescued,
  SUM(dist.people_served)        AS total_people_served,
  COUNT(DISTINCT dist.ngo_id)    AS active_ngos
FROM food_donations fd
LEFT JOIN distributions dist ON fd.id = dist.donation_id;

-- Volunteer performance
CREATE VIEW v_volunteer_performance AS
SELECT v.id, p.full_name, v.vehicle_type,
  COUNT(pk.id) AS total_pickups,
  COUNT(CASE WHEN pk.pickup_status = 'Delivered' THEN 1 END) AS completed,
  COUNT(CASE WHEN pk.pickup_status = 'Failed' THEN 1 END) AS failed
FROM volunteers v
JOIN profiles p ON v.profile_id = p.id
LEFT JOIN pickups pk ON v.id = pk.volunteer_id
GROUP BY v.id, p.full_name, v.vehicle_type;
```

---

## 8. Triggers & Functions

| Name | Type | Purpose |
|------|------|---------|
| `update_updated_at()` | Function | Generic updated_at updater |
| `handle_new_user()` | Function | Create profile on auth signup |
| `calculate_expiry_urgency(ts)` | Function | Return urgency label |
| `get_impact_stats()` | Function | Return aggregate stats |
| `accept_donation_request(req_id)` | Function | Transaction: accept + create pickup |
| `expire_old_donations()` | Function | Mark expired donations |
| `trg_*_updated_at` | Trigger | Update timestamps |
| `trg_audit_donation_*` | Trigger | Log donation changes |
| `trg_notify_*` | Trigger | Create notifications |

---

## 9. RLS Policy Design

| Table | Policy | Allowed |
|-------|--------|---------|
| profiles | SELECT own / UPDATE own | Authenticated users |
| donors | SELECT all / INSERT+UPDATE own | Donors |
| food_donations | SELECT available / INSERT own / UPDATE own | Donors + Admin |
| donation_requests | SELECT own / INSERT | NGOs + Donors (own donation) |
| pickups | SELECT own / UPDATE assigned | Volunteers + NGOs + Donors |
| distributions | INSERT own | NGOs |
| audit_logs | SELECT | Admin only |
| notifications | SELECT+UPDATE own | Own user_id |
