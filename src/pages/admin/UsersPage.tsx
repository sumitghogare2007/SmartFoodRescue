import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/api';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Heart, 
  Building2, 
  Truck, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  userType: 'ADMIN' | 'DONOR' | 'NGO' | 'VOLUNTEER';
  createdAt: string;
  updatedAt: string;
}

const UsersPage = () => {
  const { authUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'DONOR' | 'NGO' | 'VOLUNTEER' | 'ADMIN'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    if (authUser?.userType !== 'ADMIN') return;
    try {
      const response = await apiClient.get('/api/users');
      setUsers(response.data);
    } catch (err: any) {
      if (err.response?.status !== 401) {
        toast.error(err.response?.data?.message || 'Failed to fetch registered users');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [authUser]);

  // Real-time synchronization
  useRealtimeSync({
    onSync: fetchUsers,
    events: ['user:updated', 'donation:created', 'request:created'],
    enabled: authUser?.userType === 'ADMIN'
  });

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // Authorization Check
  if (authUser && authUser.userType !== 'ADMIN') {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/60 rounded-2xl flex items-center justify-center mx-auto text-red-600 dark:text-red-300">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-900 dark:text-red-200">Access Restricted</h2>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              The User Management Directory is strictly restricted to Platform Administrators. Your current role is <strong>{authUser.userType}</strong>.
            </p>
          </div>
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2.5 bg-[#12B8B0] hover:bg-[#0EA29B] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.userType === roleFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      !query || 
      u.name.toLowerCase().includes(query) || 
      u.email.toLowerCase().includes(query) || 
      (u.phone && u.phone.includes(query)) ||
      u._id.toLowerCase().includes(query);
    return matchesRole && matchesQuery;
  });

  // Metrics calculation
  const totalCount = users.length;
  const donorCount = users.filter(u => u.userType === 'DONOR').length;
  const ngoCount = users.filter(u => u.userType === 'NGO').length;
  const volunteerCount = users.filter(u => u.userType === 'VOLUNTEER').length;
  const adminCount = users.filter(u => u.userType === 'ADMIN').length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ShieldCheck className="w-3 h-3" />
            ADMIN
          </span>
        );
      case 'DONOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Heart className="w-3 h-3" />
            DONOR
          </span>
        );
      case 'NGO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E1F6F3] dark:bg-teal-950/50 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/40">
            <Building2 className="w-3 h-3" />
            NGO
          </span>
        );
      case 'VOLUNTEER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Truck className="w-3 h-3" />
            VOLUNTEER
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-white/90 dark:border-white/10 shadow-[0_8px_32px_rgba(18,184,176,0.06)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF7F5] dark:bg-teal-950/60 border border-[#BCE8E2] flex items-center justify-center text-[#12B8B0]">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">User Management Directory</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Live directory of registered platform participants synced in real time with MongoDB Atlas
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#D2EBE6] dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-[#EAF7F5] dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          title="Refresh User List"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#12B8B0]' : 'text-slate-400'}`} />
          {refreshing ? 'Syncing...' : 'Sync Directory'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4.5 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/80 dark:border-white/10">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{totalCount}</p>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4.5 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/80 dark:border-white/10">
          <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" /> Donors
          </p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{donorCount}</p>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4.5 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/80 dark:border-white/10">
          <p className="text-[11px] font-bold text-[#0F766E] dark:text-teal-400 uppercase tracking-wider flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> NGOs
          </p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{ngoCount}</p>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4.5 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/80 dark:border-white/10">
          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> Volunteers
          </p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{volunteerCount}</p>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4.5 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/80 dark:border-white/10">
          <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Admins
          </p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{adminCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/90 dark:border-white/10 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Role Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {(['ALL', 'DONOR', 'NGO', 'VOLUNTEER', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === r
                    ? 'bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/50 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-[#EAF7F5]/80 dark:hover:bg-slate-800 hover:text-[#0F766E]'
                }`}
              >
                {r === 'ALL' ? `ALL (${totalCount})` : `${r}S (${users.filter(u => u.userType === r).length})`}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] border border-white/90 dark:border-white/10 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-9 h-9 border-4 border-[#12B8B0] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm space-y-2">
            <Users className="w-10 h-10 mx-auto text-[#12B8B0]/40" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">No users found</p>
            <p className="text-xs text-slate-400">No registered users matched the active filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FCFB]/80 dark:bg-slate-800/60 border-b border-[#D2EBE6]/70 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Registration Date</th>
                  <th className="px-6 py-4">MongoDB ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2EBE6]/50 dark:divide-white/5">
                {filteredUsers.map((u) => {
                  const initials = u.name
                    ? u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'U';

                  return (
                    <tr key={u._id} className="hover:bg-[#F8FCFB]/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#EAF7F5] dark:bg-teal-950/60 text-[#12B8B0] font-bold flex items-center justify-center text-xs shrink-0 border border-[#BCE8E2] dark:border-teal-800/40">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">#{u._id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">{u.email}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        {getRoleBadge(u.userType)}
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.phone || 'Not Provided'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Active
                        </span>
                      </td>

                      {/* Registration Date */}
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* User ID */}
                      <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                        {u._id}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
