import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { donationService } from '../../services/donationService';
import { apiClient } from '../../lib/api';
import type { FoodDonation, DonationRequest, Pickup } from '../../types';
import { Package, Clock, CheckCircle, Plus, AlertCircle, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import VolunteerSelectModal from '../../components/volunteer/VolunteerSelectModal';

import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import DashboardHero from '../../components/dashboard/DashboardHero';

const DonorDashboard = () => {
  const [donations, setDonations] = useState<FoodDonation[]>([]);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'donations' | 'requests' | 'pickups'>('donations');
  const [assigningRequestId, setAssigningRequestId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useRealtimeSync({
    onSync: () => fetchDashboardData(),
    events: ['donation:created', 'donation:updated', 'request:created', 'request:accepted', 'request:updated', 'pickup:updated', 'distribution:completed'],
  });

  const fetchDashboardData = async () => {
    try {
      const [donationsRes, requestsRes, pickupsRes] = await Promise.allSettled([
        donationService.getMyDonations(),
        apiClient.get('/api/donation-requests?donorId=me'),
        apiClient.get('/api/pickups')
      ]);

      const donationsData: FoodDonation[] = donationsRes.status === 'fulfilled' ? donationsRes.value : [];
      const requestsData: DonationRequest[] = requestsRes.status === 'fulfilled' ? (requestsRes.value.data || []) : [];
      const pickupsRaw: Pickup[] = pickupsRes.status === 'fulfilled' ? (pickupsRes.value.data || []) : [];

      setDonations(donationsData);
      setRequests(requestsData);

      // Filter pickups related to donor's donations
      const myDonationIds = new Set(donationsData.map(d => d._id));
      const myPickups = pickupsRaw.filter(p => {
        const req = p.requestId as any;
        const donId = typeof req?.donationId === 'object' ? req?.donationId?._id : req?.donationId;
        return donId && myDonationIds.has(donId);
      });
      setPickups(myPickups);

      // If all three completely failed, inform the user
      if (donationsRes.status === 'rejected' && requestsRes.status === 'rejected' && pickupsRes.status === 'rejected') {
        toast.error('Failed to load donor dashboard data');
      }
    } catch (err) {
      toast.error('Failed to load donor dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#166534] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const availableCount = donations.filter(d => d.status === 'AVAILABLE').length;
  const inProgressCount = donations.filter(d => ['REQUESTED', 'ACCEPTED', 'ASSIGNED', 'RECEIVED', 'DISPATCHED'].includes(d.status)).length;
  const completedCount = donations.filter(d => ['DELIVERED', 'DISTRIBUTED'].includes(d.status)).length;
  const pendingRequests = requests.filter(r => r.requestStatus === 'PENDING');

  const rescueRate = donations.length > 0 ? Math.round((completedCount / donations.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Soft Mint Hero Centerpiece matching user screenshot */}
      <DashboardHero
        pillText="DONOR OPERATIONS DESK"
        titlePrefix="Redistribute surplus food"
        titleAccent="without the clutter."
        subtitle="Review verified NGO requests, track green-corridor pickups, and monitor real-time distribution from one calm workspace."
        statNumber={`${availableCount} Available`}
        statLabel="Rescue Pipeline"
        statSubtext={`${completedCount} completed of ${donations.length} total donations`}
        progressPercent={rescueRate}
        actions={
          <button
            onClick={() => navigate('/donations/new')}
            className="flex items-center px-4 py-2.5 bg-[#12B8B0] text-white rounded-xl hover:bg-[#0EA29B] transition-all shadow-sm shadow-[#12B8B0]/25 font-semibold text-sm active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create New Donation
          </button>
        }
      />

      {/* Metrics Row in Translucent White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/80 dark:border-white/10 flex items-center justify-between transition-all hover:shadow-[0_8px_30px_rgba(18,184,176,0.1)] hover:-translate-y-0.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">Available Food</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{availableCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#EAF7F5] dark:bg-teal-950/60 border border-[#BCE8E2] dark:border-teal-800/50 shadow-xs">
            <Package className="w-5 h-5 text-[#12B8B0]" />
          </div>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/80 dark:border-white/10 flex items-center justify-between transition-all hover:shadow-[0_8px_30px_rgba(18,184,176,0.1)] hover:-translate-y-0.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">In Progress</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{inProgressCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/50 shadow-xs">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/80 dark:border-white/10 flex items-center justify-between transition-all hover:shadow-[0_8px_30px_rgba(18,184,176,0.1)] hover:-translate-y-0.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">Delivered & Distributed</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{completedCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 shadow-xs">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Pending NGO Requests Alert */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                You have {pendingRequests.length} pending food request{pendingRequests.length > 1 ? 's' : ''} from NGOs!
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">Review and accept requests below to dispatch volunteers.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('requests')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            View Requests
          </button>
        </div>
      )}

      {/* Pill-based Tab Navigation (matching minimal SaaS design) */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-1.5 rounded-2xl border border-[#D5EFEA] dark:border-white/10 flex flex-wrap gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab('donations')}
          className={`py-2 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'donations'
              ? 'bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/50 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-[#EAF7F5]/80 dark:hover:bg-slate-800 hover:text-[#0F766E]'
          }`}
        >
          My Donations ({donations.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`py-2 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/50 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-[#EAF7F5]/80 dark:hover:bg-slate-800 hover:text-[#0F766E]'
          }`}
        >
          NGO Requests ({requests.length})
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded-md text-[10px] font-bold">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('pickups')}
          className={`py-2 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'pickups'
              ? 'bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/50 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-[#EAF7F5]/80 dark:hover:bg-slate-800 hover:text-[#0F766E]'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          Active Pickups ({pickups.length})
        </button>
      </div>

      {/* Tab 1: My Donations */}
      {activeTab === 'donations' && (
        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border border-white/90 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#D2EBE6]/70 dark:border-white/10 bg-[#F8FCFB]/80 dark:bg-slate-800/60 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">All Donations</h2>
            <span className="text-xs text-[#0F766E] dark:text-teal-300 font-semibold bg-[#E1F6F3] dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-[#BCE8E2] dark:border-teal-800/40">{donations.length} records</span>
          </div>
          {donations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No donations made yet. Click "Create New Donation" to start rescuing food.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {donations.map((donation) => (
                <div key={donation._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className="font-bold text-[#1e3a5f] hover:text-[#166534] cursor-pointer"
                        onClick={() => navigate(`/donations/${donation._id}`)}
                      >
                        {donation.foodType}
                      </h3>
                      {donation.isVegetarian && (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 text-xs rounded-full">
                          Pure Veg
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Quantity: <span className="font-semibold text-gray-800">{donation.quantity} {donation.unit}</span> | Category: {donation.foodCategory} | Posted: {new Date(donation.createdAt).toLocaleDateString()}
                    </p>
                    {donation.aadhaarId && (
                      <p className="text-xs font-mono text-gray-500">
                        Aadhaar ID: <span className="text-gray-700 font-bold">{donation.aadhaarId}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      donation.status === 'AVAILABLE' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                      donation.status === 'DISTRIBUTED' || donation.status === 'DELIVERED' ? 'bg-green-50 text-green-800 border-green-200' :
                      'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {donation.status}
                    </span>
                    <button
                      onClick={() => navigate(`/donations/${donation._id}`)}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 font-medium text-gray-700"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: NGO Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Incoming Requests from NGOs</h2>
          </div>
          {requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No NGO requests received yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {requests.map((req) => {
                const ngoObj = req.ngoId as any;
                const donObj = req.donationId as any;
                return (
                  <div key={req._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{ngoObj?.ngoName || 'NGO Partner'}</span>
                        <span className="text-xs text-gray-400">({ngoObj?.contactNo || 'Contact on file'})</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Requested: <span className="font-bold text-gray-900">{req.requestedQuantity} portions</span> for donation: "{donObj?.foodType || 'Food Listing'}"
                      </p>
                      {req.message && (
                        <p className="text-xs italic text-gray-500 bg-gray-50 p-1.5 rounded border border-gray-100">
                          "{req.message}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        req.requestStatus === 'ACCEPTED' || req.requestStatus === 'COMPLETED' ? 'bg-green-50 text-green-800 border-green-200' :
                        req.requestStatus === 'REJECTED' ? 'bg-red-50 text-red-800 border-red-200' :
                        'bg-yellow-50 text-yellow-800 border-yellow-200'
                      }`}>
                        {req.requestStatus}
                      </span>
                      {req.requestStatus === 'PENDING' && (
                        <button
                          onClick={() => setAssigningRequestId(req._id)}
                          className="px-4 py-1.5 bg-[#166534] text-white rounded text-xs font-bold hover:bg-green-800 transition-colors shadow-xs"
                        >
                          Accept & Assign Volunteer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Pickup Status */}
      {activeTab === 'pickups' && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Pickup Progress & Status</h2>
          </div>
          {pickups.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No active pickups currently scheduled for your donations.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pickups.map((p) => {
                const vol = p.volunteerId as any;
                const req = p.requestId as any;
                const ngo = req?.ngoId as any;
                return (
                  <div key={p._id} className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-gray-900 text-sm">Pickup #{p._id.slice(-6)}</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Assigned Volunteer: <span className="font-semibold text-gray-800">{vol?.userId?.name || 'Assigned Volunteer'}</span> ({vol?.vehicleType || 'Vehicle'})
                        </p>
                        <p className="text-xs text-gray-500">
                          Destination NGO: <span className="font-semibold text-gray-800">{ngo?.ngoName || 'NGO Center'}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.volunteerId && !['DELIVERED', 'DISTRIBUTED'].includes(p.pickupStatus) && (
                          <Link
                            to={`/tracking/${p._id}`}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            Track Volunteer
                          </Link>
                        )}
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {p.pickupStatus}
                        </span>
                      </div>
                    </div>

                    {/* Horizontal state progress */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 text-center text-xs">
                      {['ASSIGNED', 'RECEIVED', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED'].map((step, idx, arr) => {
                        const sIdx = arr.indexOf(p.pickupStatus);
                        const isDone = sIdx >= idx;
                        return (
                          <div key={step} className={`p-2 rounded border font-medium text-[11px] ${
                            isDone ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'
                          }`}>
                            {step}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Volunteer Selection Modal */}
      <VolunteerSelectModal
        isOpen={Boolean(assigningRequestId)}
        onClose={() => setAssigningRequestId(null)}
        title="Assign Registered Volunteer"
        subtitle="Select an eligible registered volunteer from MongoDB to assign to this food pickup."
        onAssign={async (volunteerId) => {
          if (!assigningRequestId) return;
          try {
            await donationService.acceptRequest(assigningRequestId, volunteerId);
            toast.success('Food request accepted and volunteer assigned successfully!');
            await fetchDashboardData();
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to accept request with volunteer');
          }
        }}
      />
    </div>
  );
};

export default DonorDashboard;

