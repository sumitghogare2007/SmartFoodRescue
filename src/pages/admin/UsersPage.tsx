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

  // Real-time synchronization without manual refresh
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
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/60 rounded-full flex items-center justify-center mx-auto text-red-600 dark:text-red-300">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-900 dark:text-red-200">Access Restricted</h2>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              The User Management Directory is strictly restricted to Platform Administrators. Your current role is <strong>{authUser.userType}</strong>.
            </p>
          </div>
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-[#166534] text-white rounded-md text-sm font-semibold hover:bg-green-800 transition-colors shadow-sm"
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ShieldCheck className="w-3 h-3" />
            ADMIN
          </span>
        );
      case 'DONOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Heart className="w-3 h-3" />
            DONOR
          </span>
        );
      case 'NGO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-[#166534] dark:text-emerald-300 border border-green-200 dark:border-green-800">
            <Building2 className="w-3 h-3" />
            NGO
          </span>
        );
      case 'VOLUNTEER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Truck className="w-3 h-3" />
            VOLUNTEER
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-7 h-7 text-[#166534] dark:text-emerald-400" />
            <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">User Management</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Live directory of registered platform participants loaded from MongoDB Atlas
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors shadow-xs"
          title="Refresh User List"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#166534]' : ''}`} />
          {refreshing ? 'Syncing...' : 'Sync Directory'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Users</p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{totalCount}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" /> Donors
          </p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{donorCount}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-[#166534] dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> NGOs
          </p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{ngoCount}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> Volunteers
          </p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{volunteerCount}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Admins
          </p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{adminCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Role Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {(['ALL', 'DONOR', 'NGO', 'VOLUNTEER', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  roleFilter === r
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {r === 'ALL' ? `ALL (${totalCount})` : `${r}S (${users.filter(u => u.userType === r).length})`}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#166534]"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-[#166534] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm space-y-2">
            <Users className="w-10 h-10 mx-auto text-gray-400" />
            <p className="font-semibold">No users found</p>
            <p className="text-xs">No registered users matched the active filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Phone Number</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5">Registration Date</th>
                  <th className="px-6 py-3.5">MongoDB ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((u) => {
                  const initials = u.name
                    ? u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'U';

                  return (
                    <tr key={u._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/60 text-[#166534] dark:text-green-300 font-bold flex items-center justify-center text-xs shrink-0 border border-green-200 dark:border-green-800">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-gray-100">{u.name}</p>
                            <p className="text-[11px] text-gray-400 font-mono">#{u._id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-medium">{u.email}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        {getRoleBadge(u.userType)}
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{u.phone || 'Not Provided'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          Active
                        </span>
                      </td>

                      {/* Registration Date */}
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* User ID */}
                      <td className="px-6 py-4 text-gray-400 dark:text-gray-500 font-mono text-[11px]">
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
