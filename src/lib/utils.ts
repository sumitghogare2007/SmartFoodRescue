import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { DonationStatus } from "../types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getExpiryStatus(expiryTime: string): 'Fresh' | 'Expiring Soon' | 'Urgent' | 'Expired' {
  const now = new Date().getTime();
  const expiry = new Date(expiryTime).getTime();
  const hoursLeft = (expiry - now) / (1000 * 60 * 60);

  if (hoursLeft <= 0) return 'Expired';
  if (hoursLeft <= 2) return 'Urgent';
  if (hoursLeft <= 12) return 'Expiring Soon';
  return 'Fresh';
}

export function getExpiryLabel(expiryTime: string): string {
  const now = new Date().getTime();
  const expiry = new Date(expiryTime).getTime();
  const minutesLeft = Math.floor((expiry - now) / (1000 * 60));
  
  if (minutesLeft <= 0) {
    const minAgo = Math.abs(minutesLeft);
    if (minAgo < 60) return `Expired ${minAgo}m ago`;
    const hoursAgo = Math.floor(minAgo / 60);
    return `Expired ${hoursAgo}h ago`;
  }
  
  if (minutesLeft < 60) return `Expires in ${minutesLeft}m`;
  const hoursLeft = Math.floor(minutesLeft / 60);
  const remainingMins = minutesLeft % 60;
  if (hoursLeft < 24) return `Expires in ${hoursLeft}h ${remainingMins}m`;
  
  const daysLeft = Math.floor(hoursLeft / 24);
  return `Expires in ${daysLeft}d`;
}

export function getExpiryColor(status: string): string {
  switch (status) {
    case 'Fresh': return 'text-green-400';
    case 'Expiring Soon': return 'text-yellow-400';
    case 'Urgent': return 'text-orange-400';
    case 'Expired': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

export function getStatusColor(status: DonationStatus): string {
  switch (status) {
    case 'AVAILABLE': return 'text-green-400';
    case 'REQUESTED': return 'text-blue-400';
    case 'ACCEPTED': return 'text-indigo-400';
    case 'ASSIGNED': return 'text-purple-400';
    case 'RECEIVED': return 'text-teal-400';
    case 'DISPATCHED': return 'text-teal-500';
    case 'PICKED_UP': return 'text-teal-600';
    case 'DELIVERED': return 'text-green-500';
    case 'DISTRIBUTED': return 'text-emerald-500';
    case 'EXPIRED': return 'text-red-400';
    case 'CANCELLED': return 'text-gray-400';
    default: return 'text-gray-400';
  }
}

export function getStatusBg(status: DonationStatus): string {
  switch (status) {
    case 'AVAILABLE': return 'bg-green-400/10 border-green-400/20';
    case 'REQUESTED': return 'bg-blue-400/10 border-blue-400/20';
    case 'ACCEPTED': return 'bg-indigo-400/10 border-indigo-400/20';
    case 'ASSIGNED': return 'bg-purple-400/10 border-purple-400/20';
    case 'RECEIVED': return 'bg-teal-400/10 border-teal-400/20';
    case 'DISPATCHED': return 'bg-teal-500/10 border-teal-500/20';
    case 'PICKED_UP': return 'bg-teal-600/10 border-teal-600/20';
    case 'DELIVERED': return 'bg-green-500/10 border-green-500/20';
    case 'DISTRIBUTED': return 'bg-emerald-500/10 border-emerald-500/20';
    case 'EXPIRED': return 'bg-red-400/10 border-red-400/20';
    case 'CANCELLED': return 'bg-gray-400/10 border-gray-400/20';
    default: return 'bg-gray-400/10 border-gray-400/20';
  }
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function getFoodEmoji(categoryName: string): string {
  const lowercaseCat = categoryName.toLowerCase();
  if (lowercaseCat.includes('cooked')) return '🍲';
  if (lowercaseCat.includes('produce') || lowercaseCat.includes('vegetable')) return '🥬';
  if (lowercaseCat.includes('fruit')) return '🍎';
  if (lowercaseCat.includes('bakery') || lowercaseCat.includes('bread')) return '🍞';
  if (lowercaseCat.includes('dairy')) return '🥛';
  if (lowercaseCat.includes('meat')) return '🥩';
  if (lowercaseCat.includes('pantry') || lowercaseCat.includes('grocery')) return '🥫';
  if (lowercaseCat.includes('beverage') || lowercaseCat.includes('drink')) return '🧃';
  return '🍱';
}
