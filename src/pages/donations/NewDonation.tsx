import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { donationService } from '../../services/donationService';
import toast from 'react-hot-toast';
import { Sparkles, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';

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
      <div className="max-w-2xl mx-auto p-8 bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.08)] border border-white/90 dark:border-white/10 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E1F6F3] dark:bg-teal-950/60 border border-[#BCE8E2] dark:border-teal-800/50 flex items-center justify-center text-[#12B8B0] shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Donation Successfully Listed!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Thank you for rescuing surplus food. Nearby verified NGOs have been notified and can request this package shortly.
        </p>
        <div className="bg-[#EAF7F5]/80 dark:bg-teal-950/40 p-4 rounded-2xl border border-[#BCE8E2] dark:border-teal-800/40 inline-block">
          <p className="text-xs text-[#0F766E] dark:text-teal-300 font-semibold mb-1 flex items-center justify-center gap-1">
            <ShieldCheck className="w-4 h-4" /> Verified Aadhaar ID
          </p>
          <p className="font-mono text-lg font-bold text-slate-800 dark:text-slate-100">{masked}</p>
        </div>
        <p className="text-xs text-slate-400">Redirecting to donor dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#12B8B0] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/40 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#12B8B0]" />
          Zero Waste Initiative
        </span>
      </div>

      <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border border-white/90 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] overflow-hidden">
        {/* Card Header Banner */}
        <div className="px-6 sm:px-8 py-6 border-b border-[#D2EBE6]/70 dark:border-white/10 bg-[#F8FCFB]/80 dark:bg-slate-800/60">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Create New Food Donation</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            List surplus meals for direct pickup by verified NGOs and green-corridor delivery volunteers.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8 space-y-8">
            {/* Food Details */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-[#D2EBE6]/60 dark:border-white/10 pb-2 mb-4">
                1. Food Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Food Name / Dish Title *
                  </label>
                  <input
                    type="text"
                    name="foodType"
                    required
                    placeholder="e.g., Dal Tadka, Jeera Rice, Vegetable Biryani"
                    value={formData.foodType}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    name="foodCategory"
                    required
                    value={formData.foodCategory}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                  >
                    <option value="Cooked">Cooked Food</option>
                    <option value="Raw">Raw Ingredients</option>
                    <option value="Packaged">Packaged Food</option>
                    <option value="Baked">Baked Goods</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      required
                      min="1"
                      placeholder="e.g., 25"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Unit *
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                    >
                      <option value="kg">kg</option>
                      <option value="liters">liters</option>
                      <option value="servings">servings</option>
                      <option value="boxes">boxes</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center pt-5">
                  <label className="relative flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isVegetarian"
                      id="isVegetarian"
                      checked={formData.isVegetarian}
                      onChange={handleChange}
                      className="w-4 h-4 rounded text-[#12B8B0] focus:ring-[#12B8B0] accent-[#12B8B0]"
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Pure Vegetarian
                    </span>
                  </label>
                </div>
              </div>
            </section>

            {/* Time & Verification */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-[#D2EBE6]/60 dark:border-white/10 pb-2 mb-4">
                2. Timing & Verification
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preparation Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="preparationTime"
                    required
                    value={formData.preparationTime}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expiry Time (Estimated) *
                  </label>
                  <input
                    type="datetime-local"
                    name="expiryTime"
                    required
                    value={formData.expiryTime}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Aadhaar ID (Government Verification) *
                  </label>
                  <input
                    type="text"
                    name="aadhaarId"
                    required
                    placeholder="1234-5678-9012"
                    value={formData.aadhaarId}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Format: XXXX-XXXX-XXXX. Stored securely and masked across public views.
                  </p>
                </div>
              </div>
            </section>

            {/* Location Details */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-[#D2EBE6]/60 dark:border-white/10 pb-2 mb-4">
                3. Pickup Location
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Complete Address *
                  </label>
                  <input
                    type="text"
                    name="loc_address"
                    required
                    placeholder="Floor, building, street landmark"
                    value={formData.location.address}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Area / Locality *
                  </label>
                  <input
                    type="text"
                    name="loc_area"
                    required
                    placeholder="e.g., Bandra West"
                    value={formData.location.area}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="loc_city"
                    required
                    placeholder="e.g., Mumbai"
                    value={formData.location.city}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="loc_pincode"
                    required
                    placeholder="e.g., 400050"
                    value={formData.location.pincode}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                  />
                </div>
              </div>
            </section>

            <section>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Special Handling Notes / Instructions (Optional)
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="e.g., Please bring thermal containers; entry via service gate."
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
              />
            </section>
          </div>

          {/* Form Actions Footer */}
          <div className="bg-[#F8FCFB]/80 dark:bg-slate-800/60 px-6 sm:px-8 py-4 flex justify-end items-center gap-3 border-t border-[#D2EBE6]/70 dark:border-white/10">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#12B8B0] hover:bg-[#0EA29B] text-white rounded-xl text-xs font-bold shadow-xs shadow-[#12B8B0]/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Submitting Donation...' : 'Publish Food Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewDonation;
