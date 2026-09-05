# SmartFoodRescue – Food Rescue Network

A production-ready full-stack Food Rescue Management System connecting food donors (restaurants, caterers, individuals) with NGOs and charitable organizations, coordinated by a distributed volunteer fleet.

Built on the **MERN** stack (MongoDB, Express, React, Node.js) with **TypeScript**, strictly adhering to the Food Rescue Network Entity-Relationship (ER) design.

---

## Table of Contents

1. [Architecture & Technology Stack](#architecture--technology-stack)
2. [Dual Database Support (Local & Cloud Atlas)](#dual-database-support-local--cloud-atlas)
3. [MongoDB Collections (11-Entity ER Reference)](#mongodb-collections-11-entity-er-reference)
4. [Aadhaar Security & Privacy Compliance](#aadhaar-security--privacy-compliance)
5. [Volunteer Pickup Tracking State Machine](#volunteer-pickup-tracking-state-machine)
6. [Prerequisites & Environment Configuration](#prerequisites--environment-configuration)
7. [Local Setup & Seed Instructions](#local-setup--seed-instructions)
8. [Demo Accounts](#demo-accounts)
9. [Production Deployment Guide (Render + Vercel)](#production-deployment-guide-render--vercel)
10. [REST API Reference](#rest-api-reference)
11. [DBMS Viva & Evaluation Talking Points](#dbms-viva--evaluation-talking-points)

---

## Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                 React + Vite + TypeScript                   │
│             (Clean Civic/NGO Theme: Navy & Green)           │
└──────────────┬───────────────────────────────▲──────────────┘
               │ HTTP / JSON                   │ JWT Auth Bearer
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│                  Node.js + Express Server                   │
│             (Role-Based RBAC, Data Sanitization)            │
└──────────────┬──────────────────────────────────────────────┘
               │ Mongoose ODM (11 Explicit Collections)
               ▼
┌─────────────────────────────────────────────────────────────┐
│          MongoDB Community Server / MongoDB Atlas           │
│     (Compound Indexes, Audit Logging, Masked Aadhaar)       │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite | Tailwind CSS, Lucide Icons, React Hot Toast, Civic NGO Theme |
| **Backend** | Node.js, Express, TypeScript | RESTful Architecture, JWT Authentication, bcryptjs password hashing |
| **Database** | MongoDB | Local MongoDB Community Server or Cloud MongoDB Atlas |
| **ODM** | Mongoose | Schema validation, compound indexes, virtual population, audit collections |
| **Authentication** | JWT (JSON Web Tokens) | 7-day expiration, HTTP Bearer tokens, role-based authorization |

---

## Dual Database Support (Local & Cloud Atlas)

SmartFoodRescue dynamically switches between **Local Community Server** and **Cloud MongoDB Atlas** based solely on the `MONGODB_URI` environment variable in `server/.env`.

### 1. Local Development (Default)
Ideal for offline development, local testing, and university lab evaluation:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/SmartFoodRescue
```
- Requires **MongoDB Community Server** installed and running on Windows / Linux / macOS.
- Inspect collections visually in **MongoDB Compass** by connecting to `mongodb://127.0.0.1:27017`.

### 2. Production / Cloud Atlas
Ideal for cloud deployment (Render, Railway, Fly.io) and team access:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/SmartFoodRescue?retryWrites=true&w=majority
```
- Automatic TLS encryption.
- Built-in connection pooling and replica set failover.
- Server health endpoint (`GET /api/health`) reports whether the connection is running on `atlas` or `local`.

---

## MongoDB Collections (11-Entity ER Reference)

The database schema matches the Food Rescue Network ER diagram with 11 explicitly named collections:

| Collection Name | Model File | Purpose & Relationships |
|---|---|---|
| `users` | `server/src/models/User.ts` | Base user identity (`email`, `passwordHash`, `role: ADMIN \| DONOR \| NGO \| VOLUNTEER`, `phone`, `isActive`). |
| `locations` | `server/src/models/Location.ts` | Normalized geographic addresses (`addressLine`, `city`, `state`, `postalCode`, `latitude`, `longitude`). |
| `donors` | `server/src/models/Donor.ts` | Extended donor profile (`userId` → `users`, `donorType: RESTAURANT \| CATERER \| INDIVIDUAL \| CORPORATE`, `contactPerson`, `locationId` → `locations`). |
| `ngos` | `server/src/models/NGO.ts` | Verified NGO profile (`userId` → `users`, `organizationName`, `registrationNumber`, `capacity`, `locationId` → `locations`). |
| `volunteers` | `server/src/models/Volunteer.ts` | Field volunteer profile (`userId` → `users`, `vehicleType: BIKE \| SCOOTER \| CAR \| VAN`, `availabilityStatus: AVAILABLE \| BUSY \| OFFLINE`, `rating`). |
| `foodDonations` | `server/src/models/FoodDonation.ts` | Donated food listings (`donorId` → `donors`, `aadhaarId`, `locationId` → `locations`, `foodType`, `quantity`, `unit`, `preparedAt`, `expiresAt`, `status: AVAILABLE \| REQUESTED \| ASSIGNED \| PICKED_UP \| DELIVERED \| EXPIRED`). |
| `foodItems` | `server/src/models/FoodItem.ts` | Specific food item line items (`donationId` → `foodDonations`, `itemName`, `itemCategory: COOKED \| RAW \| PACKAGED \| BAKERY \| PRODUCE`, `perishable: boolean`). |
| `donationRequests` | `server/src/models/DonationRequest.ts` | NGO claims on food (`donationId` → `foodDonations`, `ngoId` → `ngos`, `requestedQuantity`, `requestStatus: PENDING \| ACCEPTED \| REJECTED \| CANCELLED`). |
| `pickups` | `server/src/models/Pickup.ts` | Assigned logistics task (`requestId` → `donationRequests`, `volunteerId` → `volunteers`, `pickupStatus: ASSIGNED \| RECEIVED \| DISPATCHED \| DELIVERED \| DISTRIBUTED`, `scheduledTime`, `otp`). |
| `pickupTracking` | `server/src/models/PickupTracking.ts` | Immutable append-only audit trail (`pickupId` → `pickups`, `status`, `notes`, `updatedBy` → `users`, `changedAt: Date`). |
| `distributions` | `server/src/models/Distribution.ts` | Final distribution verification (`pickupId` → `pickups`, `ngoId` → `ngos`, `beneficiaryCount`, `distributedAt: Date`, `distributionStatus: PENDING \| COMPLETED`). |

---

## Aadhaar Security & Privacy Compliance

To safeguard donor privacy while maintaining legal verification accountability:
1. **Format Validation:** Verified using strict 12-digit numeric regex (`/^\d{12}$/`).
2. **Database Masking:** Server helper `maskAadhaar()` masks numbers on API retrieval so the public and regular clients only see `XXXX-XXXX-3456`.
3. **Mongoose Virtual:** `foodDonationSchema.virtual('maskedAadhaar')` derives the safe representation dynamically without persisting masked copies.
4. **Strict Isolation:** Only privileged audit pipelines or authenticated donor owners can inspect their complete record.

---

## Volunteer Pickup Tracking State Machine

SmartFoodRescue enforces a deterministic, strictly validated 5-stage state progression:

```
[ AVAILABLE ] (Donor creates food donation)
      │
      ▼ (NGO requests food)
[ REQUESTED ]
      │
      ▼ (Donor accepts request -> creates Pickup & assigns Volunteer)
[ ASSIGNED ] ────> Logged in `pickupTracking` (Status: ASSIGNED)
      │
      ▼ (Volunteer arrives at donor location & verifies food items)
[ RECEIVED ] ────> Logged in `pickupTracking` (Status: RECEIVED)
      │
      ▼ (Volunteer dispatches and transports food)
[ DISPATCHED ] ──> Logged in `pickupTracking` (Status: DISPATCHED)
      │
      ▼ (Volunteer hands over food at NGO facility)
[ DELIVERED ] ───> Logged in `pickupTracking` (Status: DELIVERED)
      │
      ▼ (NGO distributes meals to verified beneficiaries)
[ DISTRIBUTED ] ─> Logged in `pickupTracking` (Status: DISTRIBUTED)
                   & Closes `Distribution` + `FoodDonation`
```

Every single transition:
- Validates that the previous state was the direct predecessor.
- Writes an immutable document into the `pickupTracking` collection.
- Updates timestamps for real-time auditability.

---

## Prerequisites & Environment Configuration

### Prerequisites
- **Node.js**: `v18.0.0` or higher (`node -v`)
- **npm**: `v9.0.0` or higher (`npm -v`)
- **MongoDB**: MongoDB Community Server running locally, or a MongoDB Atlas connection string.

### 1. Backend Environment (`server/.env`)
Create `server/.env` based on `server/.env.example`:
```env
# Database Connection (Local or Atlas)
MONGODB_URI=mongodb://127.0.0.1:27017/SmartFoodRescue
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/SmartFoodRescue?retryWrites=true&w=majority

# Authentication
JWT_SECRET=sfr_jwt_secret_2024_super_secure_key_change_in_prod
JWT_EXPIRES_IN=7d

# Networking
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 2. Frontend Environment (`.env`)
Create `.env` in the root project folder:
```env
VITE_API_URL=http://localhost:5000
```
> Note: The frontend API client automatically strips any trailing `/api` from `VITE_API_URL`, preventing duplicate `/api/api` routing issues when hosted on platforms like Render or Vercel.

---

## Local Setup & Seed Instructions

### Step 1: Install Dependencies
```bash
# Install frontend dependencies (root)
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 2: Seed Database (Idempotent)
Run the seed script to instantly populate all 11 collections with demo accounts and full multi-stage workflows:
```bash
npm run seed
# or: cd server && npm run seed
```

Output:
```
Connected to MongoDB (Local Server): mongodb://127.0.0.1:27017/SmartFoodRescue
Database Seed Complete!
Collections verified:
  - users: 4
  - locations: 3
  - donors: 1
  - ngos: 1
  - volunteers: 1
  - foodDonations: 3
  - foodItems: 3
  - donationRequests: 2
  - pickups: 2
  - pickupTracking: 6
  - distributions: 2
```

### Step 3: Start the Backend Server
```bash
cd server
npm run dev
```
Server runs at `http://localhost:5000` and verifies MongoDB connectivity.

### Step 4: Start the Frontend Application
In a new terminal:
```bash
npm run dev
```
Application opens at `http://localhost:5173`.

---

## Demo Accounts

The seed script creates 4 pre-configured accounts with distinct dashboards and permissions:

| Role | Email | Password | Pre-configured Data |
|---|---|---|---|
| **Admin** | `admin@smartfoodrescue.com` | `Admin@123` | Full DBMS metrics (11 collections count, total kg rescued, meals served, active workflows). |
| **Donor** | `donor@smartfoodrescue.com` | `Donor@123` | Royal Orchid Caterers. 3 food listings, pending NGO requests with 1-click Accept, masked Aadhaar badge. |
| **NGO** | `ngo@smartfoodrescue.com` | `Ngo@123` | Feeding Smiles Foundation. Available donations browser, request modal, incoming pickups, distribution recording modal. |
| **Volunteer** | `volunteer@smartfoodrescue.com` | `Volunteer@123` | Active pickup task (DISPATCHED → DELIVERED), contact details for donor & NGO, audit tracking timeline with real timestamps. |

---

## Production Deployment Guide (Render + Vercel)

### Step 1: MongoDB Atlas Configuration
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Under **Network Access**, ensure IP Access List includes `0.0.0.0/0` (Allow access from anywhere) so Render's cloud servers can connect.
3. Under **Database Access**, verify your database user credentials.
4. Copy your connection string:
   `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/smartfoodrescue?retryWrites=true&w=majority`

### Step 2: Deploy Backend to Render (Web Service)
1. Push this repository to GitHub.
2. Log in to [Render](https://render.com) and click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Configure the service settings:
   - **Name:** `smartfoodrescue-api`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Under **Environment Variables**, add:
   - `MONGODB_URI`: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/smartfoodrescue?retryWrites=true&w=majority`
   - `JWT_SECRET`: `<generate-a-secure-random-secret>`
   - `JWT_EXPIRES_IN`: `7d`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `https://<your-app>.vercel.app` (or `*` during initial setup)
6. Click **Deploy Web Service**.
7. Once deployed, verify your backend health check by visiting:
   `https://<your-render-app>.onrender.com/api/health`

### Step 3: Deploy Frontend to Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New...** → **Project**.
2. Import the same GitHub repository.
3. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./` (Project Root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://<your-render-app>.onrender.com`
     *(Note: The frontend client automatically normalizes trailing `/api`, so both `https://...` and `https://.../api` work seamlessly)*
5. Click **Deploy**.
6. SPA client-side routing is handled automatically via `vercel.json`.

---

## REST API Reference

### Health & Readiness
- `GET /api/health` — Returns system status, environment (`local` vs `atlas`), and database readiness.

### Authentication
- `POST /api/auth/register` — Create account (`email`, `password`, `role`, `fullName`, `phone`, etc.).
- `POST /api/auth/login` — Authenticate and receive JWT token.
- `GET /api/auth/me` — Retrieve current authenticated user profile.
- `POST /api/auth/logout` — Revoke token session.

### Food Donations
- `GET /api/donations` — List available food donations with filter support (`foodType`, `city`, `status`).
- `POST /api/donations` — Post a new donation (validates quantity > 0, expiry > preparation time, 12-digit Aadhaar, creates `foodItems` record).
- `GET /api/donations/:id` — Get single donation details (masked Aadhaar).
- `GET /api/donations/my/donations` — Donor's active and historical donations.

### Donation Requests
- `GET /api/donation-requests` — List requests (supports `?ngoId=me` or `?donationId=...`).
- `POST /api/donation-requests` — NGO submits a claim for food donation.
- `PUT /api/donation-requests/:id/accept` — Donor accepts request; automatically creates a `Pickup` in `ASSIGNED` state and logs to `pickupTracking`.
- `PUT /api/donation-requests/:id/reject` — Donor rejects request with reason.

### Pickups & Tracking State Machine
- `GET /api/pickups` — List pickups (supports `?volunteerId=me` or `?ngoId=me`).
- `PUT /api/pickups/:id/status` — Advance pickup state (`ASSIGNED` → `RECEIVED` → `DISPATCHED` → `DELIVERED`). Enforces state sequence and records audit entry in `pickupTracking`.
- `GET /api/pickups/:id/history` — Returns full timestamped audit log from `pickupTracking`.

### Distributions
- `GET /api/distributions` — List distribution records for NGO.
- `PUT /api/distributions/:id/complete` — Record meal distribution (`beneficiaryCount`, notes). Updates `Pickup` and `FoodDonation` to `DISTRIBUTED`.

### Platform Statistics
- `GET /api/stats/platform` — Aggregated metrics for Admin Dashboard (total donations, active listings, total kg rescued, meals served, volunteers active, collection metrics).

---

## DBMS Viva & Evaluation Talking Points

When presenting this project for DBMS evaluations, emphasize these technical architectural choices:

1. **Strict 11-Collection Normalization:**
   - Instead of storing raw JSON blobs, geographic locations are normalized in `locations`, line items in `foodItems`, and audit states in `pickupTracking`.
2. **Audit Logging Pattern (`pickupTracking`):**
   - The `pickups` table contains the current state, while `pickupTracking` preserves an immutable append-only history with exact timestamps and acting user references.
3. **Compound & Performance Indexes:**
   - `foodDonations`: indexed on `{ status: 1, expiresAt: 1 }` for low-latency queries on unexpired food.
   - `donationRequests`: compound index on `{ donationId: 1, ngoId: 1 }`.
   - `pickups`: indexed on `{ volunteerId: 1, pickupStatus: 1 }`.
4. **Data Integrity & Consistency:**
   - State machine guards in `pickupController.ts` reject invalid transitions (e.g. attempting to jump from `ASSIGNED` directly to `DELIVERED`).
   - Cascade updates ensure that completing a distribution synchronizes the status of the related `Pickup` and original `FoodDonation` to `DISTRIBUTED`.
5. **Aadhaar Privacy By Design:**
   - 12-digit format enforced at the model level via regex.
   - Masked via Mongoose virtual property (`XXXX-XXXX-1234`) to prevent sensitive biometric/identity leakage on public feeds.
6. **Dual Environment Portability:**
   - Zero vendor lock-in: runs identically on local offline MongoDB Community Server for grading/demonstration, or on cloud MongoDB Atlas for production.
