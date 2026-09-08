import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import { 
  X, 
  Truck, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface VolunteerData {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  availability: 'Available' | 'Busy' | 'Offline';
  vehicleType: string;
  locationId?: {
    address?: string;
    area?: string;
    city?: string;
  };
  isVerified?: boolean;
}

interface VolunteerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (volunteerId: string) => Promise<void>;
  title?: string;
  subtitle?: string;
}

const VolunteerSelectModal: React.FC<VolunteerSelectModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  title = 'Assign Registered Volunteer',
  subtitle = 'Select an available registered volunteer courier from MongoDB to fulfill this food rescue pickup.'
}) => {
  const [volunteers, setVolunteers] = useState<VolunteerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVolunteers();
      setSelectedId(null);
    }
  }, [isOpen]);

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      // Fetch registered volunteers from MongoDB
      const response = await apiClient.get('/api/volunteers');
      const all: VolunteerData[] = response.data || [];
      // Show volunteers who are eligible/available for assignment
      const available = all.filter(v => v.availability === 'Available');
      // If none marked 'Available' explicitly, allow active registered ones so platform doesn't stall
      setVolunteers(available.length > 0 ? available : all.filter(v => v.availability !== 'Offline'));
    } catch (err: any) {
      toast.error('Failed to load registered volunteers');
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedId) {
      toast.error('Please select a volunteer from the list');
      return;
    }

    setSubmitting(true);
    try {
      await onAssign(selectedId);
      onClose();
    } catch (err: any) {
      // Error handled by caller
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-w-xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/80">
          <div>
            <h3 className="text-base font-bold text-[#1e3a5f] dark:text-emerald-400 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#166534] dark:text-emerald-400" />
              {title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Volunteer list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin text-[#166534] mb-2" />
              <span className="text-xs font-medium">Fetching registered volunteers from MongoDB...</span>
            </div>
          ) : volunteers.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                No available volunteers at the moment.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Please wait until an active volunteer becomes available or register a new volunteer account.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Eligible Registered Volunteers ({volunteers.length})
              </p>
              {volunteers.map((vol) => {
                const isSelected = selectedId === vol._id;
                const userName = vol.userId?.name || 'Registered Volunteer';
                const userPhone = vol.userId?.phone || 'Phone on file';
                const userEmail = vol.userId?.email || 'Email on file';
                const locationStr = vol.locationId?.area || vol.locationId?.city || 'Local Area Fleet';

                return (
                  <div
                    key={vol._id}
                    onClick={() => setSelectedId(vol._id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#166534] dark:border-emerald-500 bg-green-50/50 dark:bg-green-950/20 shadow-xs'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center">
                            <User className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            {userName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-200">
                            {vol.availability}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Vehicle: {vol.vehicleType || 'Courier'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300 pt-1">
                          <span className="flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                            {userPhone}
                          </span>
                          <span className="flex items-center">
                            <Mail className="w-3 h-3 mr-1 text-gray-400" />
                            {userEmail}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                            {locationStr}
                          </span>
                        </div>
                      </div>

                      <div className="pt-0.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-[#166534] dark:border-emerald-400 bg-[#166534] dark:bg-emerald-500 text-white'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-between gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {selectedId ? '1 volunteer selected' : 'No volunteer selected'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedId || submitting || volunteers.length === 0}
              className="px-4 py-2 bg-[#166534] hover:bg-green-800 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Confirm Assignment'
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VolunteerSelectModal;
