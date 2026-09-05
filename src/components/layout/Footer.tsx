import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#050810] border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                SmartFoodRescue
              </span>
            </Link>
            <p className="text-gray-400 max-w-sm mb-6">
              Connecting surplus food with those in need. Reducing waste and fighting hunger through intelligent logistics.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Platform</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-gray-400 hover:text-green-400 transition-colors">About Us</Link></li>
              <li><Link to="/features" className="text-gray-400 hover:text-green-400 transition-colors">Features</Link></li>
              <li><Link to="/donors" className="text-gray-400 hover:text-green-400 transition-colors">For Donors</Link></li>
              <li><Link to="/ngos" className="text-gray-400 hover:text-green-400 transition-colors">For NGOs</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li><Link to="/help" className="text-gray-400 hover:text-green-400 transition-colors">Help Center</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-green-400 transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-green-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-green-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} SmartFoodRescue. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> for a better world
          </div>
        </div>
      </div>
    </footer>
  );
}
