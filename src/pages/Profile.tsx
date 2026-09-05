import { useState } from 'react';
import { User, Mail, Phone, MapPin, Building, Edit2, Save, X } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+91 98765 43210',
    organization: 'Grand Hotel',
    address: '123 Marine Drive',
    city: 'Mumbai',
    role: 'donor'
  });

  const handleSave = () => {
    setIsEditing(false);
    // API call to save profile
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-gray-400 mt-1">Manage your account details and preferences</p>
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
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500/20 to-teal-500/20 border-2 border-green-500/30 flex items-center justify-center text-4xl font-bold text-green-400">
              {formData.name.charAt(0)}
            </div>
            <Badge variant="green" className="capitalize px-4">{formData.role}</Badge>
          </div>

          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <User className="w-4 h-4" /> Full Name
              </label>
              {isEditing ? (
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              ) : (
                <div className="text-white font-medium text-lg">{formData.name}</div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Address
              </label>
              <div className="text-white font-medium text-lg">{formData.email}</div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Phone Number
              </label>
              {isEditing ? (
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              ) : (
                <div className="text-white font-medium text-lg">{formData.phone}</div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <Building className="w-4 h-4" /> Organization Name
              </label>
              {isEditing ? (
                <Input value={formData.organization} onChange={e => setFormData({...formData, organization: e.target.value})} />
              ) : (
                <div className="text-white font-medium text-lg">{formData.organization}</div>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Address
              </label>
              {isEditing ? (
                <div className="flex gap-4">
                  <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="flex-1" />
                  <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-1/3" />
                </div>
              ) : (
                <div className="text-white font-medium text-lg">{formData.address}, {formData.city}</div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
