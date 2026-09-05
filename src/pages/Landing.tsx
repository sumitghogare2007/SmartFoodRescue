import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-green-100">
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2 text-[#1e3a5f]">
              <Heart className="w-8 h-8 text-[#166534]" fill="currentColor" />
              <span className="font-bold text-2xl tracking-tight">SmartFoodRescue</span>
            </div>
            <div className="hidden md:flex gap-8 items-center font-medium text-gray-600">
              <a href="#how-it-works" className="hover:text-[#1e3a5f] transition-colors">How It Works</a>
              <a href="#donors" className="hover:text-[#1e3a5f] transition-colors">For Donors</a>
              <a href="#ngos" className="hover:text-[#1e3a5f] transition-colors">For NGOs</a>
              <a href="#volunteers" className="hover:text-[#1e3a5f] transition-colors">For Volunteers</a>
              <a href="#process" className="hover:text-[#1e3a5f] transition-colors">Rescue Process</a>
              <a href="#impact" className="hover:text-[#1e3a5f] transition-colors">Impact</a>
              <Link to="/auth/login" className="text-[#166534] hover:text-green-800 font-semibold">Log In</Link>
              <Link to="/auth/register" className="bg-[#166534] text-white px-5 py-2 rounded-md hover:bg-green-800 transition-colors shadow-sm font-semibold">
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-3 py-1 bg-green-50 text-[#166534] border border-green-200 text-xs font-semibold rounded-full uppercase tracking-wider mb-4">
              Community Food Rescue Platform
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1e3a5f] tracking-tight leading-tight mb-6">
              Rescue Food. Feed People.<br />
              <span className="text-[#166534]">Reduce Waste.</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Connect surplus food from restaurants, hotels, and caterers directly with verified local NGOs. Powered by community volunteers and real-time food tracking.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/auth/register" className="inline-flex justify-center items-center bg-[#166534] text-white px-7 py-3 rounded-md font-bold text-base hover:bg-green-800 transition-colors shadow-sm">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a href="#how-it-works" className="inline-flex justify-center items-center bg-white text-[#1e3a5f] border border-gray-300 px-7 py-3 rounded-md font-bold text-base hover:bg-gray-50 transition-colors">
                How It Works
              </a>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-gray-50 border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-[#1e3a5f]">How It Works</h2>
              <p className="mt-3 text-gray-600">A transparent 3-step platform connecting surplus food with scarcity.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center mb-5 font-bold text-lg">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Donors Post Surplus Food</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Restaurants, wedding venues, and caterers list available cooked meals or fresh produce with quantity, preparation time, and verified Aadhaar ID.
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                <div className="w-12 h-12 bg-green-50 text-[#166534] rounded-lg flex items-center justify-center mb-5 font-bold text-lg">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">NGOs Request & Claim</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Registered charities and soup kitchens browse available food by urgency and proximity, submitting requests for their verified beneficiaries.
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center mb-5 font-bold text-lg">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Volunteers Transport & Distribute</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Dedicated volunteers accept pickup tasks, safely transit the food from donor to NGO, and log each stage on a real-time tracking timeline.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* For Stakeholders Sections */}
        <section id="donors" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-[#166534] uppercase tracking-wider">For Food Donors</span>
              <h2 className="text-3xl font-bold text-[#1e3a5f] mt-2 mb-4">Turn Surplus Food Into Social Good</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Whether you run a restaurant, hotel, university mess, or catering service, surplus food doesn't have to end up in landfills. List your donations in under 2 minutes.
              </p>
              <ul className="space-y-3 text-sm text-gray-700 mb-6">
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#166534] mr-2"></span> Quick listing with preparation & expiry time validation</li>
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#166534] mr-2"></span> Verified donor badge with secure masked Aadhaar verification</li>
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#166534] mr-2"></span> Full visibility of pickup status and final NGO distribution</li>
              </ul>
              <Link to="/auth/register" className="inline-block bg-[#166534] text-white px-5 py-2.5 rounded-md font-medium text-sm hover:bg-green-800 transition-colors">
                Register as Donor
              </Link>
            </div>
            <div className="bg-gray-100 p-8 rounded-lg border border-gray-200">
              <h4 className="font-bold text-[#1e3a5f] mb-3">Supported Donor Types</h4>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="p-3 bg-white rounded border border-gray-200">Restaurants & Cafes</div>
                <div className="p-3 bg-white rounded border border-gray-200">Hotels & Banquets</div>
                <div className="p-3 bg-white rounded border border-gray-200">College Campuses</div>
                <div className="p-3 bg-white rounded border border-gray-200">Supermarkets</div>
                <div className="p-3 bg-white rounded border border-gray-200">Event Organizers</div>
                <div className="p-3 bg-white rounded border border-gray-200">Individual Donors</div>
              </div>
            </div>
          </div>
        </section>

        <section id="ngos" className="py-16 bg-gray-50 border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="font-bold text-[#1e3a5f] mb-3">NGO Benefits</h4>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="p-3 bg-gray-50 rounded border border-gray-100">Live feed of fresh and packaged food nearby</li>
                  <li className="p-3 bg-gray-50 rounded border border-gray-100">Automatic freshness categorization: Fresh, Expiring Soon, Urgent</li>
                  <li className="p-3 bg-gray-50 rounded border border-gray-100">Direct coordination with assigned delivery volunteers</li>
                  <li className="p-3 bg-gray-50 rounded border border-gray-100">Beneficiary distribution recording for DBMS and audit compliance</li>
                </ul>
              </div>
              <div className="order-1 md:order-2">
                <span className="text-xs font-bold text-[#166534] uppercase tracking-wider">For NGOs & Charities</span>
                <h2 className="text-3xl font-bold text-[#1e3a5f] mt-2 mb-4">Feed More Beneficiaries With Zero Food Cost</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Registered NGOs and shelter homes can easily view surplus food available in their locality, request exact portions needed, and record distribution numbers.
                </p>
                <Link to="/auth/register" className="inline-block bg-[#166534] text-white px-5 py-2.5 rounded-md font-medium text-sm hover:bg-green-800 transition-colors">
                  Register as NGO
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="volunteers" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-[#166534] uppercase tracking-wider">For Volunteers</span>
              <h2 className="text-3xl font-bold text-[#1e3a5f] mt-2 mb-4">Be the Bridge Between Surplus and Scarcity</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Volunteers are the backbone of the food rescue network. Use your bike, car, or van to pick up fresh food from donors and deliver it safely to local shelters.
              </p>
              <ul className="space-y-3 text-sm text-gray-700 mb-6">
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#166534] mr-2"></span> Clear task dashboard showing donor address and NGO destination</li>
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#166534] mr-2"></span> Single-click status progression: Food Received → Dispatched → Delivered</li>
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#166534] mr-2"></span> Full audit trail logged securely into MongoDB</li>
              </ul>
              <Link to="/auth/register" className="inline-block bg-[#166534] text-white px-5 py-2.5 rounded-md font-medium text-sm hover:bg-green-800 transition-colors">
                Register as Volunteer
              </Link>
            </div>
            <div className="bg-emerald-50/50 p-8 rounded-lg border border-emerald-200">
              <h4 className="font-bold text-[#1e3a5f] mb-3">Vehicle Types Welcomed</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-white rounded border border-emerald-100 font-medium text-gray-800">Motorcycle / Scooter</div>
                <div className="p-3 bg-white rounded border border-emerald-100 font-medium text-gray-800">Car / Hatchback</div>
                <div className="p-3 bg-white rounded border border-emerald-100 font-medium text-gray-800">Van / Tempo</div>
                <div className="p-3 bg-white rounded border border-emerald-100 font-medium text-gray-800">Bicycle</div>
              </div>
            </div>
          </div>
        </section>

        {/* Food Rescue Process Timeline */}
        <section id="process" className="py-20 bg-gray-50 border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="text-xs font-bold text-[#166534] uppercase tracking-wider">End-to-End Tracking</span>
              <h2 className="text-3xl font-bold text-[#1e3a5f] mt-2">Food Rescue Process Workflow</h2>
              <p className="mt-3 text-gray-600">Every single status change is recorded and verified in MongoDB.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center mx-auto mb-3 text-sm">1</div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">ASSIGNED</h4>
                <p className="text-xs text-gray-500">NGO requests food; donor or admin confirms and assigns volunteer.</p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center mx-auto mb-3 text-sm">2</div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">FOOD RECEIVED</h4>
                <p className="text-xs text-gray-500">Volunteer arrives at donor, inspects packaging, and marks received.</p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-800 font-bold flex items-center justify-center mx-auto mb-3 text-sm">3</div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">DISPATCHED</h4>
                <p className="text-xs text-gray-500">Volunteer departs donor location and begins transit toward NGO.</p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mx-auto mb-3 text-sm">4</div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">DELIVERED</h4>
                <p className="text-xs text-gray-500">Food arrives at shelter. NGO confirms handover.</p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center mx-auto mb-3 text-sm">5</div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">DISTRIBUTED</h4>
                <p className="text-xs text-gray-500">Food served to community beneficiaries and logged in audit record.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section id="impact" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#1e3a5f] rounded-xl p-10 sm:p-14 text-center shadow-md">
            <h2 className="text-3xl font-bold text-white mb-3">Verified Network Impact</h2>
            <p className="text-blue-100 text-sm mb-10 max-w-2xl mx-auto">
              Real metrics tracked through MongoDB collections across donors, NGOs, and volunteers.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white">
              <div className="border-r border-blue-900 last:border-0">
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">100%</div>
                <div className="text-xs sm:text-sm text-blue-100 mt-1 font-medium">Traceable Rescues</div>
              </div>
              <div className="border-r border-blue-900 last:border-0">
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">&lt; 4 Hours</div>
                <div className="text-xs sm:text-sm text-blue-100 mt-1 font-medium">Avg. Pickup Time</div>
              </div>
              <div className="border-r border-blue-900 last:border-0">
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">Zero</div>
                <div className="text-xs sm:text-sm text-blue-100 mt-1 font-medium">Direct Platform Fees</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">Masked</div>
                <div className="text-xs sm:text-sm text-blue-100 mt-1 font-medium">Aadhaar Privacy</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 py-10 text-center text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#1e3a5f] font-bold">
            <Heart className="w-5 h-5 text-[#166534]" />
            SmartFoodRescue
          </div>
          <div>
            Built with React, Express, MongoDB & Mongoose.
          </div>
          <p>© {new Date().getFullYear()} SmartFoodRescue. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
