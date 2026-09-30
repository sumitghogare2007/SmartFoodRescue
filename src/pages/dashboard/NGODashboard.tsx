import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ngoService } from '../../services/ngoService';
import { apiClient } from '../../lib/api';
import type { FoodDonation, Pickup, DonationRequest, Distribution } from '../../types';
import { Package, Truck, Utensils, Heart, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import DashboardHero from '../../components/dashboard/DashboardHero';

const NGODashboard = () => {
  const [availableDonations, setAvailableDonations] = useState<FoodDonation[]>([]);
  const [myRequests, setMyRequests] = useState<DonationRequest[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'requests' | 'pickups' | 'distributions'>('available');

  // Request modal state
  const [selectedDonation, setSelectedDonation] = useState<FoodDonation | null>(null);
  const [requestQty, setRequestQty] = useState('');
  const [requestMsg, setRequestMsg] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  // Distribution modal state
  const [selectedDist, setSelectedDist] = useState<Distribution | null>(null);
  const [distBeneficiaries, setDistBeneficiaries] = useState('');
  const [distQty, setDistQty] = useState('');
  const [distNotes, setDistNotes] = useState('');
  const [completingDist, setCompletingDist] = useState(false);

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
      const [donationsRes, pickupsRes, requestsRes, distRes] = await Promise.all([
        ngoService.getAvailableDonations(),
        ngoService.getMyPickups(),
        apiClient.get('/api/donation-requests?ngoId=me'),
        apiClient.get('/api/distributions?ngoId=me')
      ]);
      setAvailableDonations(donationsRes);
      setPickups(pickupsRes);
      setMyRequests(requestsRes.data);
      setDistributions(distRes.data);
    } catch (err) {
      toast.error('Failed to load NGO dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonation) return;
    const qty = Number(requestQty);
    if (!qty || qty <= 0 || qty > selectedDonation.quantity) {
      toast.error(`Please enter a valid quantity between 1 and ${selectedDonation.quantity}`);
      return;
    }

    setSubmittingReq(true);
    try {
      await ngoService.createRequest({
        donationId: selectedDonation._id,
        requestedQuantity: qty,
        message: requestMsg
      });
      toast.success('Food request submitted successfully! Waiting for donor acceptance.');
      setSelectedDonation(null);
      setRequestQty('');
      setRequestMsg('');
      await fetchDashboardData();
      setActiveTab('requests');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleCompleteDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDist) return;
    const count = Number(distBeneficiaries);
    if (!count || count <= 0) {
      toast.error('Please enter a valid beneficiary count');
      return;
    }

    setCompletingDist(true);
    try {
      await apiClient.put(`/api/distributions/${selectedDist._id}/complete`, {
        beneficiaryCount: count,
        quantityDistributed: Number(distQty) || undefined,
        notes: distNotes
      });
      toast.success('Distribution recorded successfully! Workflow complete.');
      setSelectedDist(null);
      setDistBeneficiaries('');
      setDistQty('');
      setDistNotes('');
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete distribution');
    } finally {
      setCompletingDist(false);
    }
  };

  const getExpiryStatus = (expiryTime: string) => {
    const hours = (new Date(expiryTime).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hours < 0) return { label: 'Expired', color: 'bg-gray-100 text-gray-800' };
    if (hours < 4) return { label: 'Urgent', color: 'bg-red-50 text-red-800 border border-red-200' };
    if (hours < 24) return { label: 'Expiring Soon', color: 'bg-amber-50 text-amber-800 border border-amber-200' };
    return { label: 'Fresh', color: 'bg-green-50 text-green-800 border border-green-200' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#12B8B0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const incomingPickups = pickups.filter(p => !['DELIVERED', 'DISTRIBUTED'].includes(p.pickupStatus));
  const acceptedCount = myRequests.filter(r => r.requestStatus === 'ACCEPTED' || r.requestStatus === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Soft Mint Hero Centerpiece */}
      <DashboardHero
        pillText="COMMUNITY NGO DESK"
        titlePrefix="Request & distribute meals"
        titleAccent="without the clutter."
        subtitle="Claim freshly prepared surplus food, track green-corridor delivery arrivals, and record verified meal distributions to community beneficiaries."
        statNumber={availableDonations.length}
        statLabel="Available Food Lots"
        statSubtext={`${distributions.length} distributions recorded`}
        progressPercent={availableDonations.length > 0 ? 88 : 100}
        actions={
          <button
            onClick={() => navigate('/donations')}
            className="flex items-center px-4 py-2.5 bg-[#12B8B0] text-white rounded-xl hover:bg-[#0EA29B] transition-all shadow-sm shadow-[#12B8B0]/25 font-semibold text-sm active:scale-[0.99] cursor-pointer"
          >
            <Utensils className="w-4 h-4 mr-1.5" />
            Browse All Food Listings
          </button>
        }
      />

      {/* Metrics Row in Translucent White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/80 dark:border-white/10 flex items-center justify-between transition-all hover:shadow-[0_8px_30px_rgba(18,184,176,0.1)] hover:-translate-y-0.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">Available Food</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{availableDonations.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#EAF7F5] dark:bg-teal-950/60 border border-[#BCE8E2] dark:border-teal-800/50 shadow-xs">
            <Package className="w-5 h-5 text-[#12B8B0]" />
          </div>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/80 dark:border-white/10 flex items-center justify-between transition-all hover:shadow-[0_8px_30px_rgba(18,184,176,0.1)] hover:-translate-y-0.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">Accepted Requests</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{acceptedCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 shadow-xs">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/80 dark:border-white/10 flex items-center justify-between transition-all hover:shadow-[0_8px_30px_rgba(18,184,176,0.1)] hover:-translate-y-0.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">Incoming Pickups</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{incomingPickups.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/50 shadow-xs">
            <Truck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/80 dark:border-white/10 flex items-center justify-between transition-all hover:shadow-[0_8px_30px_rgba(18,184,176,0.1)] hover:-translate-y-0.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">Distributions</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{distributions.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/50 shadow-xs">
            <Heart className="w-5 h-5 text-[#12B8B0]" />
          </div>
        </div>
      </div>

      {/* Pill-based Tab Navigation */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-1.5 rounded-2xl border border-[#D5EFEA] dark:border-white/10 flex flex-wrap gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab('available')}
          className={`py-2 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'available'
              ? 'bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/50 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-[#EAF7F5]/80 dark:hover:bg-slate-800 hover:text-[#0F766E]'
          }`}
        >
          Available Food ({availableDonations.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`py-2 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/50 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-[#EAF7F5]/80 dark:hover:bg-slate-800 hover:text-[#0F766E]'
          }`}
        >
          My Requests ({myRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('pickups')}
          className={`py-2 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'pickups'
              ? 'bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/50 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-[#EAF7F5]/80 dark:hover:bg-slate-800 hover:text-[#0F766E]'
          }`}
        >
          Incoming Pickups ({pickups.length})
        </button>
        <button
          onClick={() => setActiveTab('distributions')}
          className={`py-2 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'distributions'
              ? 'bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/50 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-[#EAF7F5]/80 dark:hover:bg-slate-800 hover:text-[#0F766E]'
          }`}
        >
          Distribution Records ({distributions.length})
        </button>
      </div>

      {/* Tab 1: Available Food */}
      {activeTab === 'available' && (
        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border border-white/90 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#D2EBE6]/70 dark:border-white/10 bg-[#F8FCFB]/80 dark:bg-slate-800/60 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Surplus Food Ready For Rescue</h2>
            <span className="text-xs text-[#0F766E] dark:text-teal-300 font-semibold bg-[#E1F6F3] dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-[#BCE8E2] dark:border-teal-800/40">{availableDonations.length} available</span>
          </div>
          {availableDonations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No surplus food currently available. Please check back soon!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {availableDonations.map(donation => {
                const expStatus = getExpiryStatus(donation.expiryTime);
                const donor = donation.donorId as any;
                const loc = donation.locationId as any;
                return (
                  <div key={donation._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base">{donation.foodType}</h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${expStatus.color}`}>
                          {expStatus.label}
                        </span>
                        {donation.isVegetarian && (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 text-xs rounded-full">
                            Pure Veg
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        Available: <span className="font-bold text-gray-900">{donation.quantity} {donation.unit}</span> | Category: {donation.foodCategory}
                      </p>
                      <p className="text-xs text-gray-500">
                        Donor: <span className="font-medium text-gray-700">{donor?.organizationName || 'Verified Donor'}</span> | Location: {loc?.area || loc?.city || 'Local Area'}
                      </p>
                      {donation.aadhaarId && (
                        <p className="text-xs font-mono text-gray-500">
                          Verified Aadhaar: <span className="text-gray-700">{donation.aadhaarId}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDonation(donation);
                          setRequestQty(String(donation.quantity));
                        }}
                        className="px-4 py-2 bg-[#12B8B0] text-white rounded-xl text-xs font-bold hover:bg-[#0EA29B] transition-colors shadow-xs shadow-[#12B8B0]/25 cursor-pointer"
                      >
                        Request This Food
                      </button>
                      <button
                        onClick={() => navigate(`/donations/${donation._id}`)}
                        className="px-3 py-2 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Food Requests Placed By Your NGO</h2>
          </div>
          {myRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              You haven't requested any food donations yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {myRequests.map(req => {
                const don = req.donationId as any;
                return (
                  <div key={req._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-gray-900">{don?.foodType || 'Food Donation'}</h3>
                      <p className="text-xs text-gray-600">
                        Requested: <span className="font-semibold text-gray-900">{req.requestedQuantity} portions</span> on {new Date(req.requestDate).toLocaleDateString()}
                      </p>
                      {req.message && (
                        <p className="text-xs italic text-gray-500 bg-gray-50 p-1.5 rounded border border-gray-100">
                          "{req.message}"
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      req.requestStatus === 'ACCEPTED' || req.requestStatus === 'COMPLETED' ? 'bg-green-50 text-green-800 border-green-200' :
                      req.requestStatus === 'REJECTED' ? 'bg-red-50 text-red-800 border-red-200' :
                      'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {req.requestStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Incoming Pickups */}
      {activeTab === 'pickups' && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Incoming Deliveries & Live Volunteer Status</h2>
          </div>
          {pickups.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No pickups assigned or incoming at the moment.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pickups.map(p => {
                const vol = p.volunteerId as any;
                const req = p.requestId as any;
                const don = req?.donationId as any;
                return (
                  <div key={p._id} className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h3 className="font-bold text-[#1e3a5f] text-base">{don?.foodType || 'Food Delivery'}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Volunteer: <span className="font-semibold text-gray-800">{vol?.userId?.name || 'Assigned Volunteer'}</span> ({vol?.vehicleType || 'Vehicle'}) | Phone: {vol?.userId?.phone || 'N/A'}
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
                        <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">
                          {p.pickupStatus}
                        </span>
                      </div>
                    </div>

                    {/* Timeline visualization */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
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

      {/* Tab 4: Distribution Records */}
      {activeTab === 'distributions' && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Community Distribution Records</h2>
            <span className="text-xs text-gray-500">{distributions.length} records</span>
          </div>
          {distributions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No distributions logged yet. When deliveries arrive, record distribution counts here for DBMS audit.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {distributions.map(dist => {
                const isPending = dist.distributionStatus === 'PENDING';
                return (
                  <div key={dist._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">Distribution #{dist._id.slice(-6)}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                          dist.distributionStatus === 'COMPLETED' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {dist.distributionStatus}
                        </span>
                      </div>
                      {dist.distributionStatus === 'COMPLETED' ? (
                        <p className="text-xs text-gray-600">
                          Beneficiaries Fed: <span className="font-bold text-gray-900">{dist.beneficiaryCount || 0}</span> | Quantity: <span className="font-semibold text-gray-800">{dist.quantityDistributed || 0} units</span>
                        </p>
                      ) : (
                        <p className="text-xs text-amber-700 font-medium">
                          Food delivered to your center. Ready to be distributed to community.
                        </p>
                      )}
                      {dist.notes && <p className="text-xs text-gray-500 italic">Notes: "{dist.notes}"</p>}
                    </div>

                    {isPending && (
                      <button
                        onClick={() => {
                          setSelectedDist(dist);
                          setDistBeneficiaries('50');
                          setDistQty('25');
                        }}
                        className="px-4 py-1.5 bg-[#12B8B0] text-white rounded-xl text-xs font-bold hover:bg-[#0EA29B] transition-colors shadow-xs shadow-[#12B8B0]/25 cursor-pointer"
                      >
                        Record Distribution
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Request Food Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-[0_16px_48px_rgba(18,184,176,0.15)] border border-white/90 dark:border-white/10 max-w-md w-full p-6 sm:p-7">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Request Food Donation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Item: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDonation.foodType}</span> (Max: {selectedDonation.quantity} {selectedDonation.unit})
            </p>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Portions / Quantity Needed *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedDonation.quantity}
                  value={requestQty}
                  onChange={(e) => setRequestQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Message for Donor (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g., For evening soup kitchen shelter..."
                  value={requestMsg}
                  onChange={(e) => setRequestMsg(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDonation(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="px-5 py-2 bg-[#12B8B0] text-white rounded-xl text-xs font-bold hover:bg-[#0EA29B] transition-all shadow-xs shadow-[#12B8B0]/25 disabled:opacity-50 cursor-pointer"
                >
                  {submittingReq ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Distribution Modal */}
      {selectedDist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-[0_16px_48px_rgba(18,184,176,0.15)] border border-white/90 dark:border-white/10 max-w-md w-full p-6 sm:p-7">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Record Food Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Document final distribution to beneficiaries to complete the DBMS workflow.
            </p>
            <form onSubmit={handleCompleteDistribution} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Number of People / Beneficiaries Fed *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 75"
                  value={distBeneficiaries}
                  onChange={(e) => setDistBeneficiaries(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity Distributed (Optional)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 50"
                  value={distQty}
                  onChange={(e) => setDistQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Distribution Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed hot to local homeless shelter residents"
                  value={distNotes}
                  onChange={(e) => setDistNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDist(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completingDist}
                  className="px-5 py-2 bg-[#12B8B0] text-white rounded-xl text-xs font-bold hover:bg-[#0EA29B] transition-all shadow-xs shadow-[#12B8B0]/25 disabled:opacity-50 cursor-pointer"
                >
                  {completingDist ? 'Completing...' : 'Mark Distributed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NGODashboard;
