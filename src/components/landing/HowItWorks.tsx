import React from 'react';
import { UtensilsCrossed, Building2, Truck } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: <UtensilsCrossed className="w-8 h-8 text-emerald-400" />,
      title: "1. For Donors",
      description: "Restaurants, hotels, or event organizers with surplus food.",
      bullets: [
        "Create a donation listing",
        "Specify food type and quantity",
        "Set an expiry time",
        "Wait for NGO acceptance"
      ]
    },
    {
      icon: <Building2 className="w-8 h-8 text-teal-400" />,
      title: "2. For NGOs",
      description: "Organizations that distribute food to those in need.",
      bullets: [
        "Browse available donations",
        "Accept suitable listings",
        "Assign a volunteer for pickup",
        "Distribute to the community"
      ]
    },
    {
      icon: <Truck className="w-8 h-8 text-green-400" />,
      title: "3. For Volunteers",
      description: "Individuals helping with logistics.",
      bullets: [
        "Receive pickup assignments",
        "Navigate to donor location",
        "Transport food safely",
        "Deliver to NGO or community"
      ]
    }
  ];

  return (
    <div className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">How It Works</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            A seamless process connecting surplus food with those who need it most.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                {step.icon}
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">{step.title}</h3>
              <p className="text-gray-300 mb-6 h-12">{step.description}</p>
              <ul className="space-y-3">
                {step.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 mr-3 flex-shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
