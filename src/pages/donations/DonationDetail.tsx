import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { donationService } from '../../services/donationService';
import { ngoService } from '../../services/ngoService';
import type { FoodDonation, DonationRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Package, Clock, MapPin, CheckCircle, ShieldCheck } from 'lucide-react';
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
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#166534] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!donation) return <div>Donation not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Donation Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{donation.foodType}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    {donation.foodCategory}
                  </span>
                  {donation.isVegetarian && (
                    <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-medium flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Pure Veg
                    </span>
                  )}
                </div>
              </div>
              <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                donation.status === 'AVAILABLE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {donation.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="flex items-start">
                <Package className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Quantity</p>
                  <p className="font-medium text-gray-900">{donation.quantity} {donation.unit}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Expiry Time</p>
                  <p className="font-medium text-gray-900">{new Date(donation.expiryTime).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-start col-span-2">
                <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">
                    {typeof donation.locationId === 'object' 
                      ? `${(donation.locationId as any).address}, ${(donation.locationId as any).area}, ${(donation.locationId as any).city} - ${(donation.locationId as any).pincode}`
                      : 'Location details hidden'}
                  </p>
                </div>
              </div>
            </div>

            {donation.notes && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{donation.notes}</p>
              </div>
            )}
          </div>

          {/* Requests Section for Donor */}
          {(authUser?.userType === 'DONOR' || authUser?.userType === 'ADMIN') && requests.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-medium text-gray-900">Requests from NGOs</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {requests.map(req => (
                  <div key={req._id} className="p-6 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">
                        {typeof req.ngoId === 'object' ? (req.ngoId as any).ngoName : 'NGO'}
                      </p>
                      <p className="text-sm text-gray-500">Requested: {req.requestedQuantity} {donation.unit}</p>
                      <p className="text-xs text-gray-400">Status: {req.requestStatus}</p>
                    </div>
                    {req.requestStatus === 'PENDING' && donation.status === 'AVAILABLE' && (
                      <button 
                        onClick={() => handleAcceptRequest(req._id)}
                        className="px-4 py-2 bg-[#166534] text-white text-sm rounded hover:bg-green-800"
                      >
                        Accept Request
                      </button>
                    )}
                    {req.requestStatus === 'ACCEPTED' && (
                      <span className="flex items-center text-green-600 text-sm font-medium">
                        <CheckCircle className="w-4 h-4 mr-1" /> Accepted
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 flex items-center mb-4">
              <ShieldCheck className="w-5 h-5 text-blue-600 mr-2" />
              Donor Verification
            </h3>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
              <p className="text-sm text-blue-800">
                This donor has been verified via Aadhaar ID.
              </p>
              <div className="mt-2 font-mono text-xs text-blue-900 bg-blue-100 px-2 py-1 inline-block rounded">
                XXXX-XXXX-{donation.aadhaarId ? donation.aadhaarId.slice(-4) : 'XXXX'}
              </div>
            </div>
          </div>

          {/* Action box for NGO */}
          {authUser?.userType === 'NGO' && donation.status === 'AVAILABLE' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Request this Food</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity Needed ({donation.unit})</label>
                  <input 
                    type="number" 
                    max={donation.quantity}
                    value={reqQuantity}
                    onChange={(e) => setReqQuantity(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max available: {donation.quantity}</p>
                </div>
                <button 
                  onClick={handleRequestFood}
                  disabled={requestLoading}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#166534] hover:bg-green-800 disabled:opacity-50"
                >
                  {requestLoading ? 'Submitting...' : 'Submit Request'}
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
