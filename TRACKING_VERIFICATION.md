# Live tracking repair and verification

Date: 2026-09-28. Implementation is local; full phone/production acceptance remains pending.

## Defects found

- GPS belonged to VolunteerDashboard, so opening the tracking page unmounted and cleared the watcher. An inline error callback also changed the watch effect dependencies on every render, repeatedly restarting it.
- GPS permission failure still started EN_ROUTE with an empty request and announced success.
- Tracking page, modal, route controller, and registration invented Mumbai coordinates when real coordinates were absent. Truthy fallback also discarded valid zero coordinates.
- The socket client ignored VITE_SOCKET_URL and defaulted to localhost in production.
- The live hook repeatedly fetched routes because destination objects changed identity, resubscribed on stale-state changes, did not scope received events to pickupId, and did not display connection/authentication errors.
- Routing failures manufactured a straight-line polyline and estimated road distance/ETA. Axios was missing from the server package, although routing imports it; an isolated server installation could therefore fail.
- Socket/HTTP updates could create a live record without a started session or reactivate an arrived record. Admins were treated as assigned GPS senders. HTTP/start validation was incomplete.
- The imperative map lacked resize handling and repeatedly forced bounds during route updates. It already had Leaflet CSS, custom icons, and explicit height; those were not missing in the inspected source. Without access to the failing deployment, one exact production blank-map cause cannot be established.

## Implementation

React-Leaflet + Leaflet + OpenStreetMap tiles, with global CSS, explicit height/minimum height, ResizeObserver invalidation, declarative marker updates, initial bounds, a Follow Volunteer toggle, and visible missing-location/tile errors. The map never constructs a volunteer position. With no coordinates it shows a world viewport, not a fallback facility marker.

OSRM is the default. Longitude/latitude requests are converted to latitude/longitude geometry. Google routing remains available only with ROUTING_PROVIDER=google and GOOGLE_MAPS_API_KEY. Failed routing returns an actionable 503 and no fabricated route or ETA. Client requests are deduplicated and throttled to 25 seconds, with movement-based cache reuse and explicit manual refresh.

NavigationProvider owns the existing useDeviceGPS hook across authenticated routes. Start Navigation obtains a real device fix before starting EN_ROUTE, then opens the map. watchPosition uses high accuracy, maximumAge 2000 and timeout 10000; sends are throttled, timestamped, and never queued for stale replay after disconnect. GPS remains subject to browser foreground/permission restrictions. Arrived stops the watcher and updates the existing pickup/audit/live records.

Socket.IO remains on the existing persistent Node HTTP server. JWT authentication uses the existing User model and JWT_SECRET. Rooms remain pickup:${pickupId}; membership follows Pickup → DonationRequest → donation/donor and NGO, or the assigned Volunteer. Admins may view; only the assigned volunteer sends device GPS. Viewers rejoin after reconnect. HTTP and socket GPS paths validate coordinates, metadata, timestamps, active pickup/session, and ignore older samples. Conditional updates cannot recreate stopped records.

Existing collections: Pickup, PickupTracking (status audit), PickupLiveLocation (unique pickup, upsert at start), PickupLocationHistory (throttled socket breadcrumbs). No parallel tracking system or synthetic GPS feed was added.

Registration no longer assigns default coordinates. Registration optionally captures the facility location from the device. Existing donors/NGOs can correct their own facility coordinates in Settings while physically at that facility. The new ownership-checked coordinates endpoint refuses to modify legacy location records shared by other accounts. Existing stored records were not migrated or overwritten. Stored coordinates used in testing are not proof that those legacy locations were originally captured by GPS.

## Configuration and packages

- Installed frontend react-leaflet; retained existing leaflet, @types/leaflet, socket.io-client. Added backend axios as an explicit dependency.
- Observed local frontend API URL: http://localhost:5000. Socket falls back to that same origin unless VITE_SOCKET_URL is provided; a trailing /api is removed.
- Production: set VITE_API_URL and VITE_SOCKET_URL to the actual HTTPS Render origin. No production hostname was provided or discovered in repository configuration; production URLs are unverified.
- Render: set FRONTEND_URL to the exact Vercel origin (comma-separated origins supported), plus MONGODB_URI and JWT_SECRET. HTTP and Socket.IO share the origin allowlist. Arbitrary *.vercel.app origins are no longer accepted automatically.
- OSRM_URL defaults to https://router.project-osrm.org for development/testing. Use an appropriate provisioned routing service for production demand. Google keys are optional. TRACKING_DEBUG=true enables safe backend tracking logs; frontend diagnostics are development-only.
- Keep JWT_SECRET, database credentials and email credentials on the backend. No secrets were added to frontend code or this report.

## Verified locally

- Frontend production build and backend TypeScript build passed. Frontend bundle-size warning remains. Lint passed with warnings.
- Local MongoDB connection succeeded. Four existing pickups were inspected read-only; three had both endpoint coordinates.
- A real stored pickup returned tracking JSON for its related donor, NGO and volunteer. Each identity joined its authorized room using a real WebSocket connection. Short-lived test JWTs use the existing authentication secret and existing user records; tokens are not printed or saved.
- Unrelated donor denied both tracking HTTP API and pickup room. Invalid JWT denied socket connection. Anonymous tracking API returned 401.
- Real OSRM response for stored endpoints: 185 geometry points, 8.65 km, 10 minutes.
- Browser component verification in React StrictMode: 480-pixel map height, 18 loaded OSM tiles, two endpoint markers, one road polyline, waiting-for-GPS message. Screenshot: tmp/tracking-map-verified.png. This was a component harness using stored endpoints and an actual route, not proof of the full volunteer journey.
- Validation regression checks passed, including invalid/stale timestamps and coordinates. A forced routing outage throws an error instead of manufacturing a route. Boundary test values are not submitted to MongoDB or represented as GPS.
- Existing donor demo login returned HTTP 200 and dashboard data loaded. Full delivery/distribution/email regression was not performed.
- Startup SMTP verification failed with EAUTH / Gmail credentials rejected. Email implementation was not changed, and no email delivery success is claimed.

Commands from the repository root:

```text
npm run build
npm run build --prefix server
npm run lint
npm run test:tracking:regressions --prefix server
npm run test:tracking:readonly --prefix server
```

For the read-only integration check, start the backend first with `npm run dev --prefix server`. The old `test:tracking` script resets pickup state and sends synthetic positions; it was deliberately not used for this verification.

## Outstanding acceptance checks

Real phone GPS capture, movement without refresh, live moving marker visibility in donor and NGO browser sessions, moving ETA recalculation, arrival GPS shutdown on a physical device, delivery/distribution regression, and production Vercel/Render/WebSocket/mobile behavior remain unverified. No device movement was simulated and no existing pickup was reset to pretend these checks passed.

Use an eligible pickup assigned to the volunteer, physically at the correct pickup/facility. On an HTTPS phone page allow location access, start navigation, and move normally. Open the matching donor and NGO tracking pages simultaneously. Confirm GPS, broadcast, marker movement, timestamps, route recalculation, reconnect, Arrived, and subsequent delivery/distribution. Keep the browser foreground. Do not use an HTTP LAN URL for phone GPS.

No commit, push, or production deployment was performed: the requested pre-deployment real-phone acceptance is still pending. Supply the actual Vercel and Render URLs to verify deployment configuration and production behavior.

## Inspection and change inventory

Inspected package manifests, App/main/layout/auth context, tracking page/modal/map, GPS/live hooks, API/socket/routing clients, volunteer/donor/NGO dashboards, PickupsPage, registration/donation/settings forms, server index/middleware, pickup/tracking/auth/donation/profile controllers, pickup/location routes, routing/socket services, User/Volunteer/Donor/NGO/Location/FoodDonation/Pickup/tracking models, existing tracking test, README deployment instructions, environment examples, and Vercel rewrite configuration. There is no separate server/src/app.ts in this project.

Modified frontend: package.json, package-lock.json, .env.example, src/App.tsx, src/main.tsx, src/components/layout/AppLayout.tsx, src/components/tracking/LiveTrackingMap.tsx, src/components/tracking/LiveTrackingModal.tsx, src/hooks/useDeviceGPS.ts, src/hooks/useLiveTracking.ts, src/lib/api.ts, src/lib/socket.ts, src/services/routingClient.ts, src/pages/dashboard/VolunteerDashboard.tsx, src/pages/tracking/LiveTrackingPage.tsx, src/pages/auth/Register.tsx, src/pages/Settings.tsx.

Added frontend: src/context/NavigationContext.tsx, src/lib/coordinates.ts.

Modified backend: server/package.json, server/package-lock.json, server/.env.example, server/src/index.ts, server/src/controllers/trackingController.ts, server/src/controllers/pickupController.ts, server/src/controllers/authController.ts, server/src/models/Location.ts, server/src/routes/locations.ts, server/src/services/routingService.ts, server/src/services/trackingSocketService.ts.

Added backend checks/helper: server/src/services/trackingValidation.ts, server/scripts/test-tracking-regressions.cjs, server/scripts/verify-tracking-readonly.cjs. Unrelated pre-existing untracked presentation/assets/output files were left alone.
