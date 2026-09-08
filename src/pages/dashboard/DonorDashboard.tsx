import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { donationService } from '../../services/donationService';
import { apiClient } from '../../lib/api';
import type { FoodDonation, DonationRequest, Pickup } from '../../types';
import { Package, Clock, CheckCircle, Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import VolunteerSelectModal from '../../components/volunteer/VolunteerSelectModal';

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

  const fetchDashboardData = async () => {
    try {
      const [donationsData, requestsRes, pickupsRes] = await Promise.all([
        donationService.getMyDonations(),
        apiClient.get('/api/donation-requests?donorId=me'),
        apiClient.get('/api/pickups')
      ]);
      setDonations(donationsData);
      setRequests(requestsRes.data);
      
      // Filter pickups related to donor's donations
      const myDonationIds = new Set(donationsData.map(d => d._id));
      const myPickups = (pickupsRes.data as Pickup[]).filter(p => {
        const req = p.requestId as any;
        const donId = typeof req?.donationId === 'object' ? req?.donationId?._id : req?.donationId;
        return myDonationIds.has(donId);
      });
      setPickups(myPickups);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Donor Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your donations, view NGO requests, and track food pickups</p>
        </div>
        <button
          onClick={() => navigate('/donations/new')}
          className="flex items-center px-4 py-2 bg-[#166534] text-white rounded-md hover:bg-green-800 transition-colors shadow-sm font-medium text-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create New Donation
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Available Food</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{availableCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <Package className="w-5 h-5 text-blue-700" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{inProgressCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <Clock className="w-5 h-5 text-amber-700" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Delivered & Distributed</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{completedCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle className="w-5 h-5 text-[#166534]" />
          </div>
        </div>
      </div>

      {/* Pending NGO Requests Alert */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                You have {pendingRequests.length} pending food request{pendingRequests.length > 1 ? 's' : ''} from NGOs!
              </p>
              <p className="text-xs text-amber-700">Review and accept requests below to dispatch volunteers.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('requests')}
            className="px-3 py-1.5 bg-amber-700 text-white rounded text-xs font-medium hover:bg-amber-800"
          >
            View Requests
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('donations')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'donations'
                ? 'border-[#166534] text-[#166534] font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Donations & History ({donations.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'border-[#166534] text-[#166534] font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            NGO Requests ({requests.length})
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-xs font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pickups')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'pickups'
                ? 'border-[#166534] text-[#166534] font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pickup Status ({pickups.length})
          </button>
        </nav>
      </div>

      {/* Tab 1: My Donations */}
      {activeTab === 'donations' && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">All Donations</h2>
            <span className="text-xs text-gray-500">{donations.length} records</span>
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
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {p.pickupStatus}
                      </span>
                    </div>

                    {/* Horizontal state progress */}
                    <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
                      {['ASSIGNED', 'RECEIVED', 'DISPATCHED', 'DELIVERED'].map((step, idx, arr) => {
                        const sIdx = arr.indexOf(p.pickupStatus);
                        const isDone = sIdx >= idx;
                        return (
                          <div key={step} className={`p-2 rounded border font-medium ${
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

