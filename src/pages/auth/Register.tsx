import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Heart, Building2, MapPin, Truck } from 'lucide-react';
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
      const { confirmPassword, ...registerData } = formData;
      await signUp(registerData);
      toast.success('Registration successful! Welcome to SmartFoodRescue.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Heart className="mx-auto h-12 w-12 text-[#166534]" />
        <h2 className="mt-6 text-3xl font-extrabold text-[#1e3a5f]">
          Create a new account
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Join the SmartFoodRescue network and make an impact
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">I want to join as *</label>
              <select
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm rounded-md bg-white"
              >
                <option value="NGO">NGO / Charity Organization</option>
                <option value="DONOR">Food Donor (Restaurant, Hotel, Event)</option>
                <option value="VOLUNTEER">Volunteer Driver / Delivery</option>
              </select>
            </div>

            {/* Role-specific details */}
            {formData.userType === 'DONOR' && (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-md space-y-3">
                <div className="flex items-center text-xs font-semibold text-emerald-800">
                  <Building2 className="w-4 h-4 mr-1" /> Donor Details
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Donor Type</label>
                  <select
                    name="donorType"
                    value={formData.donorType}
                    onChange={handleChange}
                    className="mt-1 block w-full text-sm border-gray-300 rounded-md bg-white p-1.5 border"
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
                  <label className="block text-xs font-medium text-gray-700">Organization Name (Optional)</label>
                  <input
                    type="text"
                    name="organizationName"
                    placeholder="e.g. Green Leaf Cafe"
                    value={formData.organizationName}
                    onChange={handleChange}
                    className="mt-1 block w-full text-sm border-gray-300 rounded-md p-1.5 border"
                  />
                </div>
              </div>
            )}

            {formData.userType === 'NGO' && (
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-md space-y-3">
                <div className="flex items-center text-xs font-semibold text-blue-800">
                  <Building2 className="w-4 h-4 mr-1" /> NGO Details
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">NGO / Trust Name (Optional)</label>
                  <input
                    type="text"
                    name="organizationName"
                    placeholder="Defaults to your name if left empty"
                    value={formData.organizationName}
                    onChange={handleChange}
                    className="mt-1 block w-full text-sm border-gray-300 rounded-md p-1.5 border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Registration Number (Optional)</label>
                  <input
                    type="text"
                    name="registrationNo"
                    placeholder="e.g. NGO-MH-2024-001"
                    value={formData.registrationNo}
                    onChange={handleChange}
                    className="mt-1 block w-full text-sm border-gray-300 rounded-md p-1.5 border"
                  />
                </div>
              </div>
            )}

            {formData.userType === 'VOLUNTEER' && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-md space-y-3">
                <div className="flex items-center text-xs font-semibold text-amber-800">
                  <Truck className="w-4 h-4 mr-1" /> Volunteer Vehicle
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="mt-1 block w-full text-sm border-gray-300 rounded-md bg-white p-1.5 border"
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

            {/* Optional Location Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowLocation(!showLocation)}
                className="text-xs text-[#1e3a5f] hover:underline flex items-center font-medium"
              >
                <MapPin className="w-3.5 h-3.5 mr-1 text-[#166534]" />
                {showLocation ? 'Hide Location Details' : '+ Add Address / Location Details'}
              </button>

              {showLocation && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Street Address</label>
                    <input
                      type="text"
                      name="address"
                      placeholder="e.g. 45 Green Avenue"
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-1 block w-full text-xs border-gray-300 rounded-md p-1.5 border"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Area</label>
                      <input
                        type="text"
                        name="area"
                        placeholder="e.g. Andheri West"
                        value={formData.area}
                        onChange={handleChange}
                        className="mt-1 block w-full text-xs border-gray-300 rounded-md p-1.5 border"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="mt-1 block w-full text-xs border-gray-300 rounded-md p-1.5 border"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className="mt-1 block w-full text-xs border-gray-300 rounded-md p-1.5 border"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <input
                type="password"
                name="password"
                required
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#166534] hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#166534] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">Already have an account? </span>
            <Link
              to="/auth/login"
              className="font-medium text-[#1e3a5f] hover:text-blue-900"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
