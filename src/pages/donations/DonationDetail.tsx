import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { donationService } from '../../services/donationService';
import { ngoService } from '../../services/ngoService';
import type { FoodDonation, DonationRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Package, Clock, MapPin, CheckCircle, ShieldCheck, ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const DonationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authUser } = useAuth();
  
  const [donation, setDonation] = useState<FoodDonation | null>(null);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [reqQuantity, setReqQuantity] = useState('');

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const data = await donationService.getDonationById(id!);
      setDonation(data);
      
      // If DONOR or ADMIN, fetch requests on this donation
      if (authUser?.userType === 'DONOR' || authUser?.userType === 'ADMIN') {
        const reqData = await donationService.getDonationRequests(id!);
        setRequests(reqData);
      }
    } catch (err) {
      toast.error('Failed to load donation details');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestFood = async () => {
    if (!reqQuantity || isNaN(Number(reqQuantity))) {
      toast.error('Please enter a valid quantity');
      return;
    }
    setRequestLoading(true);
    try {
      await ngoService.createRequest({
        donationId: id,
        requestedQuantity: Number(reqQuantity),
      });
      toast.success('Request submitted successfully');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleAcceptRequest = async (reqId: string) => {
    try {
      await donationService.acceptRequest(reqId);
      toast.success('Request accepted');
      fetchDetail();
    } catch (err) {
      toast.error('Failed to accept request');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-9 h-9 border-4 border-[#12B8B0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-white/10 p-8 shadow-xs">
        <p className="text-slate-600 dark:text-slate-400 font-medium">Donation listing not found or has expired.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-[#12B8B0] text-white rounded-xl text-xs font-semibold hover:bg-[#0EA29B] transition-colors"
        >
          Return to Previous Page
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#12B8B0] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </button>
        <span className="text-xs font-mono text-slate-400">ID: #{donation._id.slice(-6)}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] border border-white/90 dark:border-white/10 p-6 sm:p-8">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6 pb-6 border-b border-[#D2EBE6]/70 dark:border-white/10">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{donation.foodType}</h1>
                <div className="flex items-center gap-2.5 mt-2.5">
                  <span className="px-3 py-1 bg-[#EAF7F5] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/40 rounded-full text-xs font-semibold">
                    {donation.foodCategory}
                  </span>
                  {donation.isVegetarian && (
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 rounded-full text-xs font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Pure Veg
                    </span>
                  )}
                </div>
              </div>
              <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                donation.status === 'AVAILABLE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40'
                  : 'bg-[#E1F6F3] text-[#0F766E] border-[#BCE8E2] dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/40'
              }`}>
                {donation.status}
              </span>
            </div>

            {/* Quantity, Expiry, Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F8FCFB]/80 dark:bg-slate-800/60 border border-[#D2EBE6]/60 dark:border-white/5">
                <div className="p-2.5 rounded-xl bg-[#EAF7F5] dark:bg-teal-950/60 text-[#12B8B0]">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Quantity</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-base mt-0.5">
                    {donation.quantity} {donation.unit}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F8FCFB]/80 dark:bg-slate-800/60 border border-[#D2EBE6]/60 dark:border-white/5">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Estimated Expiry</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                    {new Date(donation.expiryTime).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="sm:col-span-2 flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F8FCFB]/80 dark:bg-slate-800/60 border border-[#D2EBE6]/60 dark:border-white/5">
                <div className="p-2.5 rounded-xl bg-[#EAF7F5] dark:bg-teal-950/60 text-[#12B8B0]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pickup Location</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                    {typeof donation.locationId === 'object' 
                      ? `${(donation.locationId as any).address}, ${(donation.locationId as any).area}, ${(donation.locationId as any).city} - ${(donation.locationId as any).pincode}`
                      : 'Verified Facility Coordinates On-File'}
                  </p>
                </div>
              </div>
            </div>

            {donation.notes && (
              <div className="border-t border-[#D2EBE6]/70 dark:border-white/10 pt-4 mt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Donor Notes</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-[#EAF7F5]/50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-[#D2EBE6]/50 dark:border-white/5 leading-relaxed">
                  {donation.notes}
                </p>
              </div>
            )}
          </div>

          {/* Requests Section for Donor */}
          {(authUser?.userType === 'DONOR' || authUser?.userType === 'ADMIN') && requests.length > 0 && (
            <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] border border-white/90 dark:border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#D2EBE6]/70 dark:border-white/10 bg-[#F8FCFB]/80 dark:bg-slate-800/60 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  NGO Requests for this Listing
                </h3>
                <span className="text-xs text-[#0F766E] font-semibold bg-[#E1F6F3] dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-[#BCE8E2] dark:border-teal-800/40">
                  {requests.length} Requests
                </span>
              </div>
              <div className="divide-y divide-[#D2EBE6]/50 dark:divide-white/5">
                {requests.map(req => (
                  <div key={req._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8FCFB]/60 dark:hover:bg-slate-800/40 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {typeof req.ngoId === 'object' ? (req.ngoId as any).ngoName : 'Registered NGO'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Requested: <span className="font-semibold text-slate-800 dark:text-slate-200">{req.requestedQuantity} {donation.unit}</span>
                      </p>
                    </div>
                    {req.requestStatus === 'PENDING' && donation.status === 'AVAILABLE' && (
                      <button 
                        onClick={() => handleAcceptRequest(req._id)}
                        className="px-4 py-2 bg-[#12B8B0] hover:bg-[#0EA29B] text-white text-xs font-bold rounded-xl shadow-xs shadow-[#12B8B0]/25 transition-all cursor-pointer"
                      >
                        Accept Request & Dispatch
                      </button>
                    )}
                    {req.requestStatus === 'ACCEPTED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Accepted
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info (1 Col) */}
        <div className="space-y-6">
          {/* Government Aadhaar Verification Card */}
          <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] border border-white/90 dark:border-white/10 p-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-[#12B8B0]" />
              Aadhaar Verification
            </h3>
            <div className="bg-[#EAF7F5]/80 dark:bg-teal-950/40 border border-[#BCE8E2] dark:border-teal-800/40 p-4 rounded-2xl">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                This donor identity has been verified against Government records to ensure traceability.
              </p>
              <div className="mt-3 font-mono text-xs font-bold text-[#0F766E] dark:text-teal-300 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-[#BCE8E2] dark:border-teal-800/40 inline-block">
                XXXX-XXXX-{donation.aadhaarId ? donation.aadhaarId.slice(-4) : 'XXXX'}
              </div>
            </div>
          </div>

          {/* Action box for NGO */}
          {authUser?.userType === 'NGO' && donation.status === 'AVAILABLE' && (
            <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] border border-white/90 dark:border-white/10 p-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Claim Surplus Food</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Enter the portion count or weight required for your shelter beneficiaries.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity Needed ({donation.unit}) *
                  </label>
                  <input 
                    type="number" 
                    max={donation.quantity}
                    value={reqQuantity}
                    onChange={(e) => setReqQuantity(e.target.value)}
                    placeholder={`1 to ${donation.quantity}`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Maximum available: {donation.quantity} {donation.unit}</p>
                </div>
                <button 
                  onClick={handleRequestFood}
                  disabled={requestLoading}
                  className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#12B8B0] hover:bg-[#0EA29B] shadow-xs shadow-[#12B8B0]/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {requestLoading ? 'Submitting Claim...' : 'Submit Food Claim'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationDetail;
