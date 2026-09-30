import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/ui/Logo';
import { Building2, MapPin, Truck, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'NGO',
    // Optional role fields
    organizationName: '',
    donorType: 'Restaurant',
    registrationNo: '',
    vehicleType: 'Bike',
    // Optional location fields
    address: '',
    area: '',
    city: 'Mumbai',
    pincode: '400001',
  });
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const captureLocation = () => {
    if (!window.isSecureContext || !navigator.geolocation) { toast.error('Location capture requires HTTPS or localhost.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setLocating(false);
      toast.success('Facility GPS coordinates captured!');
    }, error => {
      toast.error(error.code === 1 ? 'Location permission denied. Please enable it in browser settings.' : 'Location unavailable. Please try again at your facility.');
      setLocating(false);
    }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 });
  };
  const [showLocation, setShowLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp({ ...formData, ...(formData.userType !== 'VOLUNTEER' ? coordinates : {}) });
      toast.success('Registration successful! Welcome to SmartFoodRescue.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAF7F5] dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Soft Mint Ambient Glow Orbs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#12B8B0]/15 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-[#D9F3EF]/60 dark:bg-teal-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 left-1/4 w-96 h-96 bg-[#12B8B0]/10 dark:bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="flex justify-center mb-3">
          <Logo size={46} showText={true} textSize="text-2xl font-bold" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/40 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#12B8B0]" />
          Join the Ecosystem
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Create a new account
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Join the verified community rescuing surplus meals across your city
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4 sm:px-0">
        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-[0_8px_32px_rgba(18,184,176,0.08)] rounded-3xl border border-white/90 dark:border-white/10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g., Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@domain.org"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                I want to join as *
              </label>
              <select
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
              >
                <option value="NGO">NGO / Shelter / Soup Kitchen</option>
                <option value="DONOR">Food Donor (Restaurant, Hotel, Caterer)</option>
                <option value="VOLUNTEER">Volunteer Courier / Driver</option>
              </select>
            </div>

            {/* Role-specific details */}
            {formData.userType === 'DONOR' && (
              <div className="p-4 bg-[#EAF7F5]/80 dark:bg-teal-950/40 border border-[#BCE8E2] dark:border-teal-800/40 rounded-2xl space-y-3">
                <div className="flex items-center text-xs font-bold text-[#0F766E] dark:text-teal-300">
                  <Building2 className="w-4 h-4 mr-1.5 text-[#12B8B0]" /> Donor Facility Details
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Donor Type</label>
                  <select
                    name="donorType"
                    value={formData.donorType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#12B8B0]/25"
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Hotel">Hotel</option>
                    <option value="College">College / University</option>
                    <option value="Supermarket">Supermarket</option>
                    <option value="Event Organizer">Event Organizer</option>
                    <option value="Individual">Individual</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Organization Name (Optional)</label>
                  <input
                    type="text"
                    name="organizationName"
                    placeholder="e.g., Grand Hyatt Banquet"
                    value={formData.organizationName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            {formData.userType === 'NGO' && (
              <div className="p-4 bg-[#EAF7F5]/80 dark:bg-teal-950/40 border border-[#BCE8E2] dark:border-teal-800/40 rounded-2xl space-y-3">
                <div className="flex items-center text-xs font-bold text-[#0F766E] dark:text-teal-300">
                  <Building2 className="w-4 h-4 mr-1.5 text-[#12B8B0]" /> NGO / Charity Details
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">NGO / Trust Name (Optional)</label>
                  <input
                    type="text"
                    name="organizationName"
                    placeholder="Defaults to your name if left empty"
                    value={formData.organizationName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Registration Number (Optional)</label>
                  <input
                    type="text"
                    name="registrationNo"
                    placeholder="e.g., NGO-MH-2024-001"
                    value={formData.registrationNo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            {formData.userType === 'VOLUNTEER' && (
              <div className="p-4 bg-[#EAF7F5]/80 dark:bg-teal-950/40 border border-[#BCE8E2] dark:border-teal-800/40 rounded-2xl space-y-3">
                <div className="flex items-center text-xs font-bold text-[#0F766E] dark:text-teal-300">
                  <Truck className="w-4 h-4 mr-1.5 text-[#12B8B0]" /> Volunteer Vehicle
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    <option value="Bike">Motorcycle / Scooter</option>
                    <option value="Car">Car</option>
                    <option value="Van">Van / Tempo</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}

            {formData.userType !== 'VOLUNTEER' && (
              <div className="p-4 bg-[#F8FCFB]/90 dark:bg-slate-800/70 border border-[#D2EBE6] dark:border-slate-700 rounded-2xl text-xs space-y-2">
                <p className="text-slate-600 dark:text-slate-300">
                  Capture your facility location while physically at your pickup or drop location for accurate GPS routing.
                </p>
                <button
                  type="button"
                  disabled={locating}
                  onClick={captureLocation}
                  className="px-4 py-2 bg-[#12B8B0] hover:bg-[#0EA29B] text-white rounded-xl font-bold transition-all shadow-xs shadow-[#12B8B0]/25 cursor-pointer disabled:opacity-50"
                >
                  {locating ? 'Calibrating GPS...' : 'Capture Device Location as Facility'}
                </button>
                {coordinates && (
                  <p role="status" className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Facility GPS coordinates captured.
                  </p>
                )}
              </div>
            )}

            {/* Optional Location Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowLocation(!showLocation)}
                className="text-xs text-[#12B8B0] hover:text-[#0EA29B] flex items-center font-bold transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 mr-1" />
                {showLocation ? 'Hide Location Details' : '+ Add Address Details'}
              </button>

              {showLocation && (
                <div className="mt-3 p-4 bg-[#F8FCFB]/90 dark:bg-slate-800/70 border border-[#D2EBE6] dark:border-slate-700 rounded-2xl space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
                    <input
                      type="text"
                      name="address"
                      placeholder="e.g. 45 Green Avenue"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Area</label>
                      <input
                        type="text"
                        name="area"
                        placeholder="e.g. Bandra West"
                        value={formData.area}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#12B8B0] hover:bg-[#0EA29B] shadow-xs shadow-[#12B8B0]/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                {!loading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">Already registered? </span>
            <Link
              to="/auth/login"
              className="text-xs font-bold text-[#12B8B0] hover:text-[#0EA29B] transition-colors"
            >
              Sign in to workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
