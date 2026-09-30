import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { donationService } from '../../services/donationService';
import type { FoodDonation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Package, Search, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';

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

  useRealtimeSync({
    onSync: () => fetchDonations(),
    events: ['donation:created', 'donation:updated'],
  });

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
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Surplus Food Listings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Explore available surplus batches ready for rapid green-corridor rescue</p>
        </div>
        {authUser?.userType === 'DONOR' && (
          <button 
            onClick={() => navigate('/donations/new')} 
            className="px-4 py-2.5 bg-[#12B8B0] text-white rounded-xl hover:bg-[#0EA29B] transition-all shadow-sm shadow-[#12B8B0]/25 font-semibold text-sm cursor-pointer"
          >
            Post Food Donation
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/90 dark:border-white/10">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search food batches, items, or categories..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/90 dark:bg-slate-800/80 border border-[#D2EBE6] dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('ALL')} 
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'ALL' 
                ? 'bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/50 shadow-xs' 
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-[#D5EFEA] dark:border-slate-700 hover:bg-[#EAF7F5]'
            }`}
          >
            All Listings
          </button>
          <button 
            onClick={() => setFilter('AVAILABLE')} 
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'AVAILABLE' 
                ? 'bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/50 shadow-xs' 
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-[#D5EFEA] dark:border-slate-700 hover:bg-[#EAF7F5]'
            }`}
          >
            Available Now
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#12B8B0] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonations.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/90 dark:border-white/10 text-slate-400 text-sm shadow-xs">
              <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              No donations found matching your search.
            </div>
          ) : (
            filteredDonations.map(donation => {
              const expStatus = getExpiryStatus(donation.expiryTime);
              return (
                <div 
                  key={donation._id} 
                  className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-white/80 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] hover:shadow-[0_8px_30px_rgba(18,184,176,0.12)] hover:-translate-y-1 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col"
                  onClick={() => navigate(`/donations/${donation._id}`)}
                >
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{donation.foodType}</h3>
                        <span className="inline-block mt-1 text-[11px] font-semibold bg-[#EAF7F5] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/40 px-2.5 py-0.5 rounded-md">
                          {donation.foodCategory}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${expStatus.color}`}>
                        {expStatus.label}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mt-4 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2 text-[#12B8B0]" />
                        <span className="font-bold text-slate-800 dark:text-slate-100">{donation.quantity} {donation.unit}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-[#12B8B0]" />
                        <span className="truncate">
                          {typeof donation.locationId === 'object' ? (donation.locationId as any).city : 'Location Available'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-slate-400" />
                        <span>Exp: {new Date(donation.expiryTime).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#F8FCFB]/80 dark:bg-slate-800/60 px-5 py-3 border-t border-[#D2EBE6]/60 dark:border-white/10 flex items-center justify-between">
                    {authUser?.userType === 'NGO' && donation.status === 'AVAILABLE' ? (
                      <button className="w-full text-center text-xs font-bold text-[#12B8B0] hover:text-[#0EA29B] transition-colors py-1">
                        View & Claim Food →
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">Status: {donation.status}</span>
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
