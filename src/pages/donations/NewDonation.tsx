import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { donationService } from '../../services/donationService';
import toast from 'react-hot-toast';

const NewDonation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    foodType: '',
    foodCategory: 'Cooked',
    quantity: '',
    unit: 'kg',
    preparationTime: '',
    expiryTime: '',
    isVegetarian: true,
    aadhaarId: '',
    notes: '',
    location: {
      address: '',
      area: '',
      city: '',
      pincode: ''
    }
  });
  const [showMaskedAadhaar, setShowMaskedAadhaar] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name.startsWith('loc_')) {
      const locField = name.split('_')[1];
      setFormData(prev => ({ ...prev, location: { ...prev.location, [locField]: value } }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateAadhaar = (aadhaar: string) => {
    return /^\d{4}-\d{4}-\d{4}$/.test(aadhaar);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAadhaar(formData.aadhaarId)) {
      toast.error('Aadhaar ID must be in format ####-####-####');
      return;
    }

    setLoading(true);
    try {
      // Structure the data to match expected backend format
      const payload = {
        foodType: formData.foodType,
        foodCategory: formData.foodCategory,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        preparationTime: formData.preparationTime,
        expiryTime: formData.expiryTime,
        isVegetarian: formData.isVegetarian,
        aadhaarId: formData.aadhaarId,
        notes: formData.notes,
        // Using a nested structure - backend can create Location if needed or use directly
        locationInfo: formData.location 
      };

      await donationService.createDonation(payload as any);
      setShowMaskedAadhaar(true);
      toast.success('Donation created successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create donation');
      setLoading(false);
    }
  };

  if (showMaskedAadhaar) {
    const masked = `XXXX-XXXX-${formData.aadhaarId.slice(-4)}`;
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
        <h2 className="text-2xl font-bold text-[#166534] mb-4">Donation Successful!</h2>
        <p className="text-gray-600 mb-6">Thank you for your generous donation. NGOs will be able to request this food shortly.</p>
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 inline-block">
          <p className="text-sm text-gray-500 mb-1">Verified Aadhaar ID</p>
          <p className="font-mono text-lg font-bold text-[#1e3a5f]">{masked}</p>
        </div>
        <p className="mt-6 text-sm text-gray-500">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Create New Donation</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-8">
          
          {/* Food Details */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">Food Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Food Name/Type</label>
                <input type="text" name="foodType" required value={formData.foodType} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select name="foodCategory" required value={formData.foodCategory} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm">
                  <option value="Cooked">Cooked Food</option>
                  <option value="Raw">Raw Ingredients</option>
                  <option value="Packaged">Packaged Food</option>
                  <option value="Baked">Baked Goods</option>
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input type="number" name="quantity" required min="1" value={formData.quantity} onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm" />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <select name="unit" value={formData.unit} onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm">
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                    <option value="servings">servings</option>
                    <option value="boxes">boxes</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center pt-6">
                <input type="checkbox" name="isVegetarian" id="isVegetarian" checked={formData.isVegetarian} onChange={handleChange}
                  className="h-4 w-4 text-[#166534] focus:ring-[#166534] border-gray-300 rounded" />
                <label htmlFor="isVegetarian" className="ml-2 block text-sm text-gray-900">
                  Pure Vegetarian
                </label>
              </div>
            </div>
          </section>

          {/* Time & Verification */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">Timing & Verification</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Preparation Time</label>
                <input type="datetime-local" name="preparationTime" required value={formData.preparationTime} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Time (Estimated)</label>
                <input type="datetime-local" name="expiryTime" required value={formData.expiryTime} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Aadhaar ID (For Verification)</label>
                <input type="text" name="aadhaarId" required placeholder="1234-5678-9012" value={formData.aadhaarId} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm font-mono" />
                <p className="mt-1 text-xs text-gray-500">Format: XXXX-XXXX-XXXX. This will be securely masked.</p>
              </div>
            </div>
          </section>

          {/* Location Details */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">Pickup Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Complete Address</label>
                <input type="text" name="loc_address" required value={formData.location.address} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Area/Locality</label>
                <input type="text" name="loc_area" required value={formData.location.area} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input type="text" name="loc_city" required value={formData.location.city} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pincode</label>
                <input type="text" name="loc_pincode" required value={formData.location.pincode} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm" />
              </div>
            </div>
          </section>

          <section>
            <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
            <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm" />
          </section>

        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
          <button type="button" onClick={() => navigate('/dashboard')}
            className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none mr-4">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="bg-[#166534] border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-green-800 focus:outline-none disabled:opacity-50">
            {loading ? 'Creating...' : 'Submit Donation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewDonation;
