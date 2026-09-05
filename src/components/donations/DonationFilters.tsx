import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

export interface FilterState {
  status: string;
  category: string;
  city: string;
  urgency: string;
  donorType: string;
  sortBy: string;
}

export interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  categories: any[];
}

export function DonationFilters({ filters, onChange, categories: _categories }: Props) {
  const handleChange = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({
      status: '', category: '', city: '', urgency: '', donorType: '', sortBy: 'newest'
    });
  };

  const hasActiveFilters = Object.values(filters).some(val => val !== '' && val !== 'newest');

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Input 
            placeholder="Search donations..." 
            icon={<Search className="w-4 h-4" />}
            className="w-full"
          />
        </div>
        
        <div className="flex flex-wrap lg:flex-nowrap gap-3">
          <Select 
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Available', label: 'Available' },
              { value: 'Requested', label: 'Requested' },
              { value: 'Assigned', label: 'Assigned' }
            ]}
            className="w-40"
          />
          
          <Select 
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              { value: 'prepared', label: 'Prepared Food' },
              { value: 'raw', label: 'Raw Ingredients' },
              { value: 'packaged', label: 'Packaged Food' }
            ]}
            className="w-40"
          />
          
          <Select 
            value={filters.sortBy}
            onChange={(e) => handleChange('sortBy', e.target.value)}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'expiring', label: 'Expiring Soon' },
              { value: 'quantity', label: 'Largest Quantity' }
            ]}
            className="w-40"
          />

          <Button variant="secondary" className="px-3" title="More Filters">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
