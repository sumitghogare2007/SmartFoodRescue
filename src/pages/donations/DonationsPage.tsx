import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { donationService } from '../../services/donationService';
import type { FoodDonation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Package, Search, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const DonationsPage = () => {
  const [donations, setDonations] = useState<FoodDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, AVAILABLE
  const [search, setSearch] = useState('');
  
  const { authUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      // By default load ALL donations that are available if NGO, else if DONOR maybe load theirs?
      // Based on instructions: For NGO show available, but this is a general page.
      // We will call the general donations endpoint. 
      // If we are NGO, we mostly care about available. 
      // We will use donationService.getAvailableDonations() for simplicity, or if we had a generic GET we'd use it.
      // Let's get AVAILABLE for now.
      const data = await donationService.getAvailableDonations();
      setDonations(data);
    } catch (err) {
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatus = (expiryTime: string) => {
    const hours = (new Date(expiryTime).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hours < 0) return { label: 'Expired', color: 'bg-gray-100 text-gray-800' };
    if (hours < 4) return { label: 'Urgent', color: 'bg-red-100 text-red-800' };
    if (hours < 24) return { label: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Fresh', color: 'bg-green-100 text-green-800' };
  };

  const filteredDonations = donations.filter(d => 
    (filter === 'ALL' || d.status === filter) &&
    d.foodType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Available Donations</h1>
        {authUser?.userType === 'DONOR' && (
          <button onClick={() => navigate('/donations/new')} className="px-4 py-2 bg-[#166534] text-white rounded-md hover:bg-green-800 transition-colors">
            Post Food
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search food name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[#166534] focus:border-[#166534]"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('ALL')} 
            className={`px-4 py-2 rounded-md border text-sm font-medium ${filter === 'ALL' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('AVAILABLE')} 
            className={`px-4 py-2 rounded-md border text-sm font-medium ${filter === 'AVAILABLE' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Available
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#166534] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonations.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white rounded-lg border border-gray-200 text-gray-500">
              No donations found matching your criteria.
            </div>
          ) : (
            filteredDonations.map(donation => {
              const expStatus = getExpiryStatus(donation.expiryTime);
              return (
                <div key={donation._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                     onClick={() => navigate(`/donations/${donation._id}`)}>
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{donation.foodType}</h3>
                        <span className="inline-block mt-1 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {donation.foodCategory}
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${expStatus.color}`}>
                        {expStatus.label}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mt-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium text-gray-900">{donation.quantity} {donation.unit}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="truncate">
                          {typeof donation.locationId === 'object' ? (donation.locationId as any).city : 'Location Available'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Exp: {new Date(donation.expiryTime).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                    {authUser?.userType === 'NGO' && donation.status === 'AVAILABLE' ? (
                      <button className="w-full text-center text-sm font-medium text-[#166534] hover:text-green-800">
                        View & Request
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">Status: {donation.status}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default DonationsPage;
