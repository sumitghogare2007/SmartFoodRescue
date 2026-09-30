import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle, 
  X, 
  Loader2, 
  Truck,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface VolunteerOption {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  vehicleType: string;
  availability: string;
  locationId?: {
    address: string;
    area: string;
    city: string;
  };
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
  title = 'Assign Volunteer Courier',
  subtitle = 'Select an active registered volunteer to transport this food donation.'
}) => {
  const [volunteers, setVolunteers] = useState<VolunteerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVolunteers();
    } else {
      setSelectedId(null);
    }
  }, [isOpen]);

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/volunteers');
      const data: VolunteerOption[] = Array.isArray(response.data) ? response.data : [];
      setVolunteers(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0]._id);
      }
    } catch (err: any) {
      toast.error('Failed to load registered volunteers from database');
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
    } catch (err) {
      // Error handled by parent onAssign
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-[0_16px_48px_rgba(18,184,176,0.15)] border border-white/90 dark:border-white/10 max-w-xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#D2EBE6]/70 dark:border-white/10 flex items-center justify-between bg-[#F8FCFB]/80 dark:bg-slate-800/60">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#12B8B0]" />
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-[#EAF7F5] dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Volunteer list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#12B8B0] mb-2" />
              <span className="text-xs font-semibold">Fetching registered volunteers from MongoDB...</span>
            </div>
          ) : volunteers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                No available volunteers at the moment.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Please wait until an active volunteer becomes available or register a new volunteer account.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
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
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#12B8B0] bg-[#EAF7F5]/70 dark:bg-teal-950/40 shadow-xs ring-2 ring-[#12B8B0]/20'
                        : 'border-[#D2EBE6] dark:border-slate-700 hover:border-[#12B8B0]/50 bg-white dark:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center">
                            <User className="w-3.5 h-3.5 mr-1.5 text-[#12B8B0]" />
                            {userName}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/40">
                            {vol.availability}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                            Vehicle: {vol.vehicleType || 'Courier'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                          <span className="flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-[#12B8B0]" />
                            {userPhone}
                          </span>
                          <span className="flex items-center">
                            <Mail className="w-3 h-3 mr-1 text-[#12B8B0]" />
                            {userEmail}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1 text-[#12B8B0]" />
                            {locationStr}
                          </span>
                        </div>
                      </div>

                      <div className="pt-0.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-[#12B8B0] bg-[#12B8B0] text-white'
                              : 'border-slate-300 dark:border-slate-600'
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
        <div className="px-6 py-4 border-t border-[#D2EBE6]/70 dark:border-white/10 bg-[#F8FCFB]/80 dark:bg-slate-800/60 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {selectedId ? '1 volunteer selected' : 'No volunteer selected'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedId || submitting || volunteers.length === 0}
              className="px-5 py-2 bg-[#12B8B0] hover:bg-[#0EA29B] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-xs shadow-[#12B8B0]/25 cursor-pointer"
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
