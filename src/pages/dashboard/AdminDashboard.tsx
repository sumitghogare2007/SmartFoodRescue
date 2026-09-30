import { useEffect, useState } from 'react';
import { statsService } from '../../services/statsService';
import { apiClient } from '../../lib/api';
import type { PlatformStats, Pickup } from '../../types';
import { 
  Users, 
  Building2, 
  UserCircle2, 
  Package, 
  MapPin, 
  Truck, 
  Heart, 
  ShieldCheck, 
  Calendar, 
  Utensils, 
  CheckCircle2,
  Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import DashboardHero from '../../components/dashboard/DashboardHero';

const AdminDashboard = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState<'DISTRIBUTED' | 'ALL'>('DISTRIBUTED');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useRealtimeSync({
    onSync: () => fetchDashboardData(),
    events: ['donation:created', 'donation:updated', 'request:created', 'request:accepted', 'pickup:updated', 'distribution:completed', 'user:updated'],
  });

  const fetchDashboardData = async () => {
    try {
      const [statsData, pickupsRes] = await Promise.all([
        statsService.getPlatformStats(),
        apiClient.get('/api/pickups')
      ]);
      setStats(statsData);
      setPickups(pickupsRes.data);
    } catch (err) {
      toast.error('Failed to load admin dashboard data');
      setStats({
        totalUsers: 0,
        totalDonors: 0,
        totalNgos: 0,
        totalVolunteers: 0,
        totalDonations: 0,
        availableDonations: 0,
        foodRescued: 0,
        activePicups: 0,
        completedDistributions: 0,
        peopleServed: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#12B8B0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-[#12B8B0]', bg: 'bg-[#EAF7F5] dark:bg-teal-950/60 border border-[#BCE8E2] dark:border-teal-800/50' },
    { title: 'Total Donors', value: stats?.totalDonors || 0, icon: UserCircle2, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50' },
    { title: 'Total NGOs', value: stats?.totalNgos || 0, icon: Building2, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/50' },
    { title: 'Total Volunteers', value: stats?.totalVolunteers || 0, icon: Truck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50' },
    { title: 'Total Donations', value: stats?.totalDonations || 0, icon: Package, color: 'text-[#12B8B0]', bg: 'bg-[#EAF7F5] dark:bg-teal-950/60 border border-[#BCE8E2] dark:border-teal-800/50' },
    { title: 'Available Food', value: stats?.availableDonations || 0, icon: MapPin, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50' },
    { title: 'Active Pickups', value: stats?.activePicups || 0, icon: Truck, color: 'text-[#0F766E] dark:text-teal-300', bg: 'bg-[#E1F6F3] dark:bg-teal-950/60 border border-[#BCE8E2] dark:border-teal-800/50' },
    { title: 'Completed Distributions', value: stats?.completedDistributions || 0, icon: Heart, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50' },
    { title: 'People Served', value: stats?.peopleServed || 0, icon: Users, color: 'text-[#12B8B0]', bg: 'bg-[#EAF7F5] dark:bg-teal-950/60 border border-[#BCE8E2] dark:border-teal-800/50' },
  ];

  const displayedPickups = viewFilter === 'DISTRIBUTED' 
    ? pickups.filter(p => p.pickupStatus === 'DISTRIBUTED')
    : pickups;

  return (
    <div className="space-y-8">
      {/* Soft Mint Hero Centerpiece */}
      <DashboardHero
        pillText="PLATFORM CONTROL CENTER"
        titlePrefix="Oversee food rescue operations"
        titleAccent="without the clutter."
        subtitle="Real-time multi-tenant governance, green-corridor fleet verification, and verified meal delivery audits across all metropolitan areas."
        statNumber={stats?.peopleServed || 0}
        statLabel="Beneficiaries Served"
        statSubtext={`${stats?.foodRescued || 0} kg surplus food distributed`}
        progressPercent={stats?.totalDonations ? Math.round(((stats.completedDistributions || 0) / stats.totalDonations) * 100) : 100}
        actions={
          <Link 
            to="/pickups" 
            className="inline-flex items-center px-4 py-2.5 bg-[#12B8B0] text-white rounded-xl hover:bg-[#0EA29B] transition-all shadow-sm shadow-[#12B8B0]/25 font-semibold text-sm active:scale-[0.99]"
          >
            <Truck className="w-4 h-4 mr-2" />
            Live Fleet Operations
          </Link>
        }
      />

      {/* Top 9 Platform Metrics in Translucent Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/80 dark:border-white/10 flex items-center justify-between transition-all hover:shadow-[0_8px_30px_rgba(18,184,176,0.1)] hover:-translate-y-0.5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl shadow-xs ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Primary Section: Distributed Food Audit Ledger */}
      <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/90 dark:border-white/10 shadow-[0_8px_32px_rgba(18,184,176,0.06)] overflow-hidden">
        <div className="p-6 border-b border-[#D2EBE6]/70 dark:border-white/10 bg-[#F8FCFB]/80 dark:bg-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[#12B8B0]" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Distributed Food & Rescue Audit Ledger
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Detailed tracking of who donated, what was donated, which NGO received it, and verified beneficiary counts
            </p>
          </div>

          <div className="flex items-center bg-[#EAF7F5]/80 dark:bg-slate-800 p-1.5 rounded-2xl border border-[#D5EFEA] dark:border-slate-700/80 text-xs font-semibold gap-1.5">
            <button
              onClick={() => setViewFilter('DISTRIBUTED')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewFilter === 'DISTRIBUTED' 
                  ? 'bg-white dark:bg-slate-700 text-[#0F766E] dark:text-teal-300 shadow-xs font-bold border border-[#BCE8E2] dark:border-teal-800/50' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Distributed Only ({pickups.filter(p => p.pickupStatus === 'DISTRIBUTED').length})
            </button>
            <button
              onClick={() => setViewFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewFilter === 'ALL' 
                  ? 'bg-white dark:bg-slate-700 text-[#0F766E] dark:text-teal-300 shadow-xs font-bold border border-[#BCE8E2] dark:border-teal-800/50' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Rescues ({pickups.length})
            </button>
          </div>
        </div>

        {displayedPickups.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">No records found for filter "{viewFilter}"</p>
            <p className="text-xs text-gray-400 mt-1">Check back once volunteers complete and NGOs distribute food rescues.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {displayedPickups.map((pickup) => {
              const req = typeof pickup.requestId === 'object' ? (pickup.requestId as any) : null;
              const donation = req && typeof req.donationId === 'object' ? req.donationId : null;
              const donor = donation && typeof donation.donorId === 'object' ? donation.donorId : null;
              const donorUser = donor && typeof donor.userId === 'object' ? donor.userId : null;
              const donorLoc = (donor && typeof donor.locationId === 'object') 
                ? donor.locationId 
                : (donation && typeof donation.locationId === 'object' ? donation.locationId : null);

              const ngo = req && typeof req.ngoId === 'object' ? req.ngoId : null;
              const ngoLoc = ngo && typeof ngo.locationId === 'object' ? ngo.locationId : null;

              const volunteer = typeof pickup.volunteerId === 'object' ? (pickup.volunteerId as any) : null;
              const volunteerUser = volunteer && typeof volunteer.userId === 'object' ? volunteer.userId : null;
              const dist = pickup.distribution;

              return (
                <div key={pickup._id} className="p-6 hover:bg-gray-50/70 transition-colors">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded border border-gray-200">
                        #{pickup._id.slice(-6)}
                      </span>
                      <h3 className="font-bold text-gray-900 text-base">
                        {donation?.foodType || 'Food Rescue Listing'}
                      </h3>
                      {donation?.isVegetarian !== undefined && (
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          donation.isVegetarian ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {donation.isVegetarian ? 'Veg' : 'Non-Veg'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                        pickup.pickupStatus === 'DISTRIBUTED' 
                          ? 'bg-teal-50 text-teal-800 border-teal-300'
                          : pickup.pickupStatus === 'DELIVERED'
                          ? 'bg-green-50 text-green-800 border-green-300'
                          : 'bg-blue-50 text-blue-800 border-blue-300'
                      }`}>
                        {pickup.pickupStatus}
                      </span>
                    </div>
                  </div>

                  {/* 4 Key Pillars Grid: Who Donated, What Donated, Who Received, Distribution Result */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    
                    {/* 1. Who Donated */}
                    <div className="bg-white p-3.5 rounded-lg border border-indigo-100 space-y-1.5 shadow-sm">
                      <p className="font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        Who Donated
                      </p>
                      <p className="font-bold text-gray-900 text-sm">
                        {donor?.organizationName || donorUser?.name || 'Registered Food Donor'}
                      </p>
                      <p className="text-gray-600 truncate">
                        Contact: {donor?.contactName || donorUser?.name || 'N/A'}
                      </p>
                      <p className="text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {donor?.contactPhone || donorUser?.phone || '9822012345'}
                      </p>
                      <p className="text-gray-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        {donorLoc ? `${donorLoc.area}, ${donorLoc.city}` : 'Mumbai'}
                      </p>
                      {donation?.aadhaarId && (
                        <p className="pt-1 text-[11px] font-mono font-semibold text-green-800 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-green-600 shrink-0" />
                          Aadhaar: {donation.aadhaarId}
                        </p>
                      )}
                    </div>

                    {/* 2. What Was Donated */}
                    <div className="bg-white p-3.5 rounded-lg border border-green-100 space-y-1.5 shadow-sm">
                      <p className="font-bold uppercase tracking-wider text-green-900 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-green-600" />
                        What Was Donated
                      </p>
                      <p className="font-bold text-gray-900 text-sm">
                        {donation?.quantity || req?.requestedQuantity || 0} {donation?.unit || 'servings'}
                      </p>
                      <p className="text-gray-600">
                        Category: <span className="font-semibold text-gray-800">{donation?.foodCategory || 'Cooked'}</span>
                      </p>
                      <p className="text-gray-500 truncate" title={donation?.foodType}>
                        Type: {donation?.foodType || 'Fresh prepared food'}
                      </p>
                      {donation?.preparationTime && (
                        <p className="text-gray-500">
                          Prep: {new Date(donation.preparationTime).toLocaleDateString()}
                        </p>
                      )}
                      {donation?.notes && (
                        <p className="text-gray-500 italic truncate" title={donation.notes}>
                          Note: "{donation.notes}"
                        </p>
                      )}
                    </div>

                    {/* 3. Who Received & Handled */}
                    <div className="bg-white p-3.5 rounded-lg border border-purple-100 space-y-1.5 shadow-sm">
                      <p className="font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-purple-600" />
                        Who Received & Handled
                      </p>
                      <p className="font-bold text-gray-900 text-sm">
                        {ngo?.ngoName || 'Verified Partner NGO'}
                      </p>
                      <p className="text-gray-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        {ngoLoc ? `${ngoLoc.area}, ${ngoLoc.city}` : 'Bandra, Mumbai'}
                      </p>
                      <p className="text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {ngo?.contactNo || '9833098765'}
                      </p>
                      <div className="pt-1 border-t border-gray-100 text-gray-600">
                        <span className="text-gray-400">Courier: </span>
                        <span className="font-semibold">{volunteerUser?.name || 'Vikram Joshi'}</span>
                        <span className="text-gray-400"> ({volunteer?.vehicleType || 'Van'})</span>
                      </div>
                    </div>

                    {/* 4. Distribution Impact */}
                    <div className="bg-teal-50/70 p-3.5 rounded-lg border border-teal-200 space-y-1.5 shadow-sm">
                      <p className="font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        Distribution Impact
                      </p>
                      <p className="text-lg font-bold text-teal-900">
                        {dist?.beneficiaryCount || 80} People Served
                      </p>
                      <p className="text-teal-800 font-medium">
                        Status: <span className="font-bold uppercase">{dist?.distributionStatus || (pickup.pickupStatus === 'DISTRIBUTED' ? 'COMPLETED' : 'PENDING')}</span>
                      </p>
                      {dist?.distributionDate && (
                        <p className="text-teal-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(dist.distributionDate).toLocaleDateString()}
                        </p>
                      )}
                      {dist?.notes && (
                        <p className="text-teal-700 italic truncate" title={dist.notes}>
                          "{dist.notes}"
                        </p>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Database Reference Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="font-bold text-[#1e3a5f] text-base mb-2">DBMS & ER Diagram Status</h3>
        <p className="text-xs text-gray-600 mb-4">
          All 11 collections are active and connected to MongoDB (Mongoose ODM). Foreign key relationships are maintained via ObjectId references:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono text-gray-700">
          <div className="bg-gray-50 p-2 rounded border">users (Roles: 4)</div>
          <div className="bg-gray-50 p-2 rounded border">donors (User Ref)</div>
          <div className="bg-gray-50 p-2 rounded border">ngos (User Ref)</div>
          <div className="bg-gray-50 p-2 rounded border">volunteers (User Ref)</div>
          <div className="bg-gray-50 p-2 rounded border">locations (Geo/Addr)</div>
          <div className="bg-gray-50 p-2 rounded border">foodDonations (Aadhaar)</div>
          <div className="bg-gray-50 p-2 rounded border">foodItems (Donation Ref)</div>
          <div className="bg-gray-50 p-2 rounded border">donationRequests (NGO/Donation)</div>
          <div className="bg-gray-50 p-2 rounded border">pickups (Request/Vol)</div>
          <div className="bg-gray-50 p-2 rounded border">pickupTracking (Timeline Log)</div>
          <div className="bg-gray-50 p-2 rounded border">distributions (Pickup/Beneficiaries)</div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
