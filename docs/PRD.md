# SmartFoodRescue — Product Requirements Document (PRD)

**Version:** 1.0 | **Date:** 2026-08-28 | **Status:** Approved for Development  
**Project Type:** DBMS Academic Project + Full-Stack Web Application

---

## 1. Executive Summary

SmartFoodRescue is a full-stack food rescue platform that digitizes the process of connecting food donors (restaurants, hotels, events, etc.) with NGOs and beneficiaries, while managing volunteers who pick up and deliver rescued food.

**Dual Purpose:**
1. **Real-World Impact:** Reduce food wastage, rescue surplus food, feed communities in need.
2. **DBMS Academic Excellence:** Showcase advanced DB design, normalization, constraints, triggers, functions, views, transactions, and audit logging.

---

## 2. Problem Statement

Every day, millions of kg of food go to waste while millions of people go hungry. The gap exists not because food is unavailable, but because there is no efficient coordination system to identify surplus food, match it with NGOs, organize pickup/delivery logistics, and track the end-to-end process. SmartFoodRescue bridges this gap.

---

## 3. Goals & Objectives

| # | Objective | Priority |
|---|-----------|----------|
| 1 | Enable donors to register surplus food donations | P0 |
| 2 | Enable NGOs to browse, request, and receive food | P0 |
| 3 | Enable volunteers to accept and manage pickups | P0 |
| 4 | Track the complete donation lifecycle (Available → Distributed) | P0 |
| 5 | Record people benefited and meals rescued | P0 |
| 6 | Provide role-based dashboards with analytics | P1 |
| 7 | Implement smart NGO-to-donation matching | P1 |
| 8 | Show food expiry urgency in real time | P1 |
| 9 | Maintain complete audit log for all critical actions | P1 |
| 10 | Demonstrate advanced DBMS concepts | P0 |

---

## 4. Stakeholders / User Roles

### 4.1 Admin
- Full system access; manage all data, users, donations, pickups, distributions
- Manage verification of donors and NGOs
- Access to system-wide analytics

### 4.2 Donor
- Restaurants, hotels, colleges, events, supermarkets, households
- Register surplus food donations, view donation status, cancel pending donations
- View NGO requests for their donations

### 4.3 NGO (Non-Governmental Organization)
- Browse available donations, request food, post food requirements
- Track assigned pickups, record distributions to beneficiaries
- Submit feedback after delivery

### 4.4 Volunteer
- Browse available pickup tasks, accept assignments
- Update pickup/delivery status in real time
- View task history

### 4.5 Public (Unauthenticated)
- View landing page and aggregated impact statistics
- Register as Donor, NGO, or Volunteer

---

## 5. Functional Requirements

### 5.1 Authentication & User Management
- **FR-001:** Register with email/password via Supabase Auth
- **FR-002:** Select role (Donor / NGO / Volunteer) at registration
- **FR-003:** Role-specific profile created automatically on registration
- **FR-004:** Login redirects to role-specific dashboard
- **FR-005:** Profile update (name, phone, avatar)
- **FR-006:** Forgot password via email link
- **FR-007:** Admin role is protected and not self-assignable

### 5.2 Donor Features
- **FR-010:** Create food donation: food name, category, quantity, servings, preparation time, expiry time, pickup deadline, storage type, pickup address, food condition, description
- **FR-011:** View all donations with real-time status
- **FR-012:** Edit donation (only if status is 'Available')
- **FR-013:** Cancel donation (only if status is 'Available' or 'Requested')
- **FR-014:** View NGO requests for each donation
- **FR-015:** Approve/reject NGO requests
- **FR-016:** Donor dashboard: total meals donated, active donations, completed donations

### 5.3 NGO Features
- **FR-020:** Browse all available donations with search and filter
- **FR-021:** Request a donation (creates donation_request record)
- **FR-022:** Post food requirements (quantity, category, urgency, deadline)
- **FR-023:** View accepted donations and track pickup status
- **FR-024:** Record distribution (quantity distributed, people served, beneficiary groups)
- **FR-025:** Submit feedback (rating, food quality, delivery rating, comments)
- **FR-026:** Dashboard: available donations, pending pickups, distributions, people served

### 5.4 Volunteer Features
- **FR-030:** View available pickup tasks
- **FR-031:** Accept a task (updates volunteer availability and pickup record)
- **FR-032:** Update status: On The Way → Picked Up → Delivered
- **FR-033:** Dashboard: assigned tasks, completed tasks, today's tasks

### 5.5 Donation Lifecycle
- **FR-040:** Starts in 'Available' status
- **FR-041:** NGO requests → 'Requested'
- **FR-042:** Donor accepts request → 'Accepted'
- **FR-043:** Volunteer assigned → 'Assigned', pickup record created
- **FR-044:** Volunteer picks up → 'Picked Up'
- **FR-045:** Volunteer delivers → 'Delivered'
- **FR-046:** NGO records distribution → 'Distributed'
- **FR-047:** Passes expiry_time and still 'Available' → 'Expired' (trigger)
- **FR-048:** Invalid status transitions must be prevented at DB level

### 5.6 Smart Features
- **FR-050:** Expiry Priority: Show Fresh / Expiring Soon / Urgent / Expired based on time remaining
- **FR-051:** NGO Matching: Rule-based scoring (category, quantity, proximity, urgency, capacity)
- **FR-052:** Food Journey Timeline: Visual step-by-step tracker of donation lifecycle

### 5.7 Search & Filters
- **FR-060:** Filter donations by: food category, location/city, quantity range, expiry urgency, status, donor type
- **FR-061:** Sort by: expiring soon, largest quantity, newest, nearest

### 5.8 Analytics & Reporting
- **FR-070:** Total meals rescued (sum of distributed servings)
- **FR-071:** Total people benefited (sum from distributions)
- **FR-072–076:** Donation trends, category breakdown, donor type breakdown, NGO/volunteer performance

### 5.9 Notifications
- **FR-080:** In-app notification when NGO requests donor's donation
- **FR-081:** In-app notification when donor accepts/rejects NGO request
- **FR-082:** In-app notification when volunteer is assigned
- **FR-083:** Notification when donation is expiring soon

### 5.10 Audit Logging
- **FR-090:** Critical actions logged: donation created/updated/cancelled, request accepted/rejected, pickup assigned, distribution recorded
- **FR-091:** Stores: user_id, action, entity_type, entity_id, old_data (JSONB), new_data (JSONB), timestamp

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| Security | Supabase RLS on all tables; no service-role key in frontend |
| Security | Donors manage only their own donations |
| Security | NGOs manage only their own requests/distributions |
| Security | Volunteers update only their assigned pickups |
| Performance | Dashboard loads within 2 seconds |
| Usability | Mobile-responsive (320px+) |
| Usability | Loading states, empty states, toast notifications |
| Design | Glassmorphism UI; dark navy background; green/teal accents |
| Code Quality | Reusable React components, TypeScript, env variables for secrets |

---

## 7. Out of Scope (v1.0)
- Real-time GPS map tracking, SMS/Email notifications, Payment gateway, Mobile native app, AI-based matching, Multi-language support

---

## 8. Success Metrics
- All 17 database tables created with proper constraints
- Full donation lifecycle works end-to-end
- NGO matching algorithm produces meaningful scores
- All 4 role dashboards display real database data
- RLS policies prevent unauthorized access
- Audit log captures all critical events
- Demo data makes the app look populated and real
