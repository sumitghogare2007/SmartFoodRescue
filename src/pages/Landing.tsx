import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import Logo from '../components/ui/Logo';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9FCFB] via-[#EAF7F5] to-[#D9F3EF] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-[#E1F6F3] relative overflow-hidden">
      {/* Soft Mint Ambient Glow Orbs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#12B8B0]/15 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/4 -right-40 w-96 h-96 bg-[#D9F3EF]/70 dark:bg-teal-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 left-1/3 w-96 h-96 bg-[#12B8B0]/10 dark:bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Glassmorphic Navbar */}
      <nav className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-[#D2EBE6]/70 dark:border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center">
              <Logo size={40} showText={true} textSize="text-2xl font-bold" />
            </Link>
            <div className="hidden md:flex gap-7 items-center font-medium text-xs text-slate-600 dark:text-slate-300">
              <a href="#how-it-works" className="hover:text-[#12B8B0] transition-colors">How It Works</a>
              <a href="#donors" className="hover:text-[#12B8B0] transition-colors">For Donors</a>
              <a href="#ngos" className="hover:text-[#12B8B0] transition-colors">For NGOs</a>
              <a href="#volunteers" className="hover:text-[#12B8B0] transition-colors">For Volunteers</a>
              <a href="#process" className="hover:text-[#12B8B0] transition-colors">Rescue Process</a>
              <a href="#impact" className="hover:text-[#12B8B0] transition-colors">Impact</a>
              <Link to="/auth/login" className="text-slate-700 dark:text-slate-200 hover:text-[#12B8B0] font-semibold transition-colors">
                Sign In
              </Link>
              <Link
                to="/auth/register"
                className="bg-[#12B8B0] hover:bg-[#0EA29B] text-white px-5 py-2.5 rounded-xl shadow-xs shadow-[#12B8B0]/25 font-bold transition-all text-xs"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/40 text-xs font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#12B8B0]" />
              Soft Mint Clean Architecture
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Rescue Food. Feed People.<br />
              <span className="text-[#12B8B0]">Without the clutter.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Connect surplus meals from restaurants, hotels, and caterers directly with verified local charities. Powered by community volunteers and real-time GPS telemetry.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
              <Link
                to="/auth/register"
                className="w-full sm:w-auto inline-flex justify-center items-center bg-[#12B8B0] hover:bg-[#0EA29B] text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-xs shadow-[#12B8B0]/25 transition-all"
              >
                Join the Network
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex justify-center items-center bg-white/80 dark:bg-slate-900/80 hover:bg-[#EAF7F5] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-[#D2EBE6] dark:border-slate-700 px-7 py-3.5 rounded-xl font-bold text-sm transition-all"
              >
                How It Works
              </a>
            </div>
          </div>
        </section>

        {/* How It Works (3 Glass Cards) */}
        <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">How It Works</h2>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">A transparent 3-step green corridor connecting food surplus with hunger relief.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/90 dark:border-white/10 shadow-[0_8px_32px_rgba(18,184,176,0.06)] hover:shadow-[0_12px_40px_rgba(18,184,176,0.12)] transition-all">
              <div className="w-12 h-12 bg-[#E1F6F3] dark:bg-teal-950/60 text-[#12B8B0] border border-[#BCE8E2] rounded-2xl flex items-center justify-center mb-5 font-black text-lg shadow-xs">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Donors List Surplus</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Restaurants, wedding venues, and caterers list available cooked meals or fresh produce with quantity, preparation time, and verified Aadhaar ID.
              </p>
            </div>

            <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/90 dark:border-white/10 shadow-[0_8px_32px_rgba(18,184,176,0.06)] hover:shadow-[0_12px_40px_rgba(18,184,176,0.12)] transition-all">
              <div className="w-12 h-12 bg-[#E1F6F3] dark:bg-teal-950/60 text-[#12B8B0] border border-[#BCE8E2] rounded-2xl flex items-center justify-center mb-5 font-black text-lg shadow-xs">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">NGOs Request & Claim</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Registered charities and soup kitchens browse available food by urgency and proximity, submitting requests for their verified beneficiaries.
              </p>
            </div>

            <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/90 dark:border-white/10 shadow-[0_8px_32px_rgba(18,184,176,0.06)] hover:shadow-[0_12px_40px_rgba(18,184,176,0.12)] transition-all">
              <div className="w-12 h-12 bg-[#E1F6F3] dark:bg-teal-950/60 text-[#12B8B0] border border-[#BCE8E2] rounded-2xl flex items-center justify-center mb-5 font-black text-lg shadow-xs">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Volunteers Transport</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Dedicated couriers accept pickup tasks, safely transit the food from donor to NGO, and log each stage on a real-time GPS tracking timeline.
              </p>
            </div>
          </div>
        </section>

        {/* Stakeholder Sections */}
        <section id="donors" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-[#0F766E] dark:text-teal-300 uppercase tracking-wider">For Food Donors</span>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2 mb-4">Turn Surplus Meals Into Social Good</h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Whether you run a restaurant, hotel, university mess, or catering service, surplus food doesn't have to end up in landfills. List your donations in under 2 minutes.
              </p>
              <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#12B8B0]" /> Quick listing with preparation & expiry time validation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#12B8B0]" /> Verified donor badge with secure masked Aadhaar verification</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#12B8B0]" /> Full visibility of pickup status and final NGO distribution</li>
              </ul>
              <Link to="/auth/register" className="inline-block bg-[#12B8B0] hover:bg-[#0EA29B] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all">
                Register as Donor
              </Link>
            </div>
            <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/90 dark:border-white/10 shadow-[0_8px_32px_rgba(18,184,176,0.06)]">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-4 text-sm">Supported Donor Facilities</h4>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3 bg-[#F8FCFB]/80 dark:bg-slate-800/60 rounded-xl border border-[#D2EBE6]/70 dark:border-white/5 font-semibold">Restaurants & Cafes</div>
                <div className="p-3 bg-[#F8FCFB]/80 dark:bg-slate-800/60 rounded-xl border border-[#D2EBE6]/70 dark:border-white/5 font-semibold">Hotels & Banquets</div>
                <div className="p-3 bg-[#F8FCFB]/80 dark:bg-slate-800/60 rounded-xl border border-[#D2EBE6]/70 dark:border-white/5 font-semibold">College Campuses</div>
                <div className="p-3 bg-[#F8FCFB]/80 dark:bg-slate-800/60 rounded-xl border border-[#D2EBE6]/70 dark:border-white/5 font-semibold">Supermarkets</div>
                <div className="p-3 bg-[#F8FCFB]/80 dark:bg-slate-800/60 rounded-xl border border-[#D2EBE6]/70 dark:border-white/5 font-semibold">Event Organizers</div>
                <div className="p-3 bg-[#F8FCFB]/80 dark:bg-slate-800/60 rounded-xl border border-[#D2EBE6]/70 dark:border-white/5 font-semibold">Individual Donors</div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="process" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-[#0F766E] dark:text-teal-300 uppercase tracking-wider">End-to-End Tracking</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">Food Rescue Process Workflow</h2>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Every single stage change is audited and permanently verified in MongoDB.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['ASSIGNED', 'FOOD RECEIVED', 'DISPATCHED', 'DELIVERED', 'DISTRIBUTED'].map((step, idx) => (
              <div key={step} className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-white/90 dark:border-white/10 text-center shadow-xs">
                <div className="w-8 h-8 rounded-full bg-[#E1F6F3] text-[#12B8B0] font-bold flex items-center justify-center mx-auto mb-3 text-xs border border-[#BCE8E2]">
                  {idx + 1}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs mb-1">{step}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Stage verified with immutable timestamps.</p>
              </div>
            ))}
          </div>
        </section>

        {/* Impact Section */}
        <section id="impact" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#0F766E] to-[#12B8B0] rounded-3xl p-10 sm:p-14 text-center shadow-[0_16px_48px_rgba(18,184,176,0.25)] text-white">
            <h2 className="text-3xl font-extrabold mb-3">Verified Network Impact</h2>
            <p className="text-teal-100 text-xs sm:text-sm mb-10 max-w-2xl mx-auto">
              Real metrics tracked through MongoDB collections across donors, NGOs, and volunteers.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="border-r border-teal-500/40 last:border-0">
                <div className="text-3xl sm:text-4xl font-black text-white">100%</div>
                <div className="text-xs text-teal-100 mt-1 font-semibold">Traceable Rescues</div>
              </div>
              <div className="border-r border-teal-500/40 last:border-0">
                <div className="text-3xl sm:text-4xl font-black text-white">&lt; 4 Hours</div>
                <div className="text-xs text-teal-100 mt-1 font-semibold">Avg. Pickup Time</div>
              </div>
              <div className="border-r border-teal-500/40 last:border-0">
                <div className="text-3xl sm:text-4xl font-black text-white">Zero</div>
                <div className="text-xs text-teal-100 mt-1 font-semibold">Direct Platform Fees</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-white">Masked</div>
                <div className="text-xs text-teal-100 mt-1 font-semibold">Aadhaar Privacy</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-t border-[#D2EBE6]/70 dark:border-white/10 py-10 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
            <Heart className="w-4 h-4 text-[#12B8B0]" />
            SmartFoodRescue Platform
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
