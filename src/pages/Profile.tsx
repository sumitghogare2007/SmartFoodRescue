import { useState } from 'react';
import { User, Mail, Phone, MapPin, Building, Edit2, Save, X } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Profile() {
  const { authUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: authUser?.name || 'Administrator',
    email: authUser?.email || 'admin@smartfoodrescue.org',
    phone: authUser?.phone || '+91 98765 43210',
    organization: 'SmartFoodRescue Central',
    address: '123 Marine Drive',
    city: 'Mumbai',
    role: authUser?.userType?.toLowerCase() || 'admin'
  });

  const handleSave = () => {
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Profile</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your account details and preferences</p>
        </div>
        {!isEditing ? (
          <Button variant="secondary" onClick={() => setIsEditing(true)} icon={<Edit2 className="w-4 h-4" />}>
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)} icon={<X className="w-4 h-4" />}>Cancel</Button>
            <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>Save</Button>
          </div>
        )}
      </div>

      <GlassCard className="p-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#E1F6F3] to-[#BCE8E2] dark:from-teal-950 dark:to-teal-800 border-2 border-[#12B8B0]/40 flex items-center justify-center text-4xl font-bold text-[#0F766E] dark:text-teal-300 shadow-xs">
              {formData.name.charAt(0)}
            </div>
            <Badge variant="mint" className="capitalize px-4">{formData.role}</Badge>
          </div>

          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4 text-[#12B8B0]" /> Full Name
              </label>
              {isEditing ? (
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              ) : (
                <div className="text-slate-900 dark:text-slate-100 font-bold text-lg">{formData.name}</div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#12B8B0]" /> Email Address
              </label>
              <div className="text-slate-900 dark:text-slate-100 font-bold text-lg">{formData.email}</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#12B8B0]" /> Phone Number
              </label>
              {isEditing ? (
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              ) : (
                <div className="text-slate-900 dark:text-slate-100 font-bold text-lg">{formData.phone}</div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Building className="w-4 h-4 text-[#12B8B0]" /> Organization Name
              </label>
              {isEditing ? (
                <Input value={formData.organization} onChange={e => setFormData({...formData, organization: e.target.value})} />
              ) : (
                <div className="text-slate-900 dark:text-slate-100 font-bold text-lg">{formData.organization}</div>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#12B8B0]" /> Address
              </label>
              {isEditing ? (
                <div className="flex gap-4">
                  <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="flex-1" />
                  <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-1/3" />
                </div>
              ) : (
                <div className="text-slate-900 dark:text-slate-100 font-medium text-base">{formData.address}, {formData.city}</div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
