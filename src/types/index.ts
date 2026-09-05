export type UserType = 'ADMIN' | 'DONOR' | 'NGO' | 'VOLUNTEER';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  userType: UserType;
  createdAt: string;
}

export interface Location {
  _id: string;
  address: string;
  area: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface Donor {
  _id: string;
  userId: string | User;
  donorType: string;
  organizationName: string;
  contactName: string;
  contactPhone: string;
  locationId: string | Location;
}

export interface NGO {
  _id: string;
  userId: string | User;
  ngoName: string;
  registrationNo: string;
  contactNo: string;
  locationId: string | Location;
  capacity: number;
}

export interface Volunteer {
  _id: string;
  userId: string | User;
  availability: 'Available' | 'Busy' | 'Offline';
  vehicleType: string;
}

export type DonationStatus = 'AVAILABLE' | 'REQUESTED' | 'ACCEPTED' | 'ASSIGNED' | 'RECEIVED' | 'DISPATCHED' | 'PICKED_UP' | 'DELIVERED' | 'DISTRIBUTED' | 'EXPIRED' | 'CANCELLED';

export interface FoodDonation {
  _id: string;
  donorId: string | Donor;
  locationId: string | Location;
  donationDate: string;
  quantity: number;
  unit: string;
  foodType: string;
  foodCategory: string;
  preparationTime: string;
  expiryTime: string;
  status: DonationStatus;
  aadhaarId?: string;
  notes?: string;
  isVegetarian: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FoodItem {
  _id: string;
  donationId: string;
  foodName: string;
  foodCategory: string;
  quantity: number;
  unit: string;
  isVegetarian: boolean;
}

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'ASSIGNED' | 'COMPLETED';

export interface DonationRequest {
  _id: string;
  donationId: string | FoodDonation;
  ngoId: string | NGO;
  requestedQuantity: number;
  requestDate: string;
  requestStatus: RequestStatus;
  message?: string;
}

export type PickupStatus = 'ASSIGNED' | 'RECEIVED' | 'DISPATCHED' | 'DELIVERED' | 'DISTRIBUTED';

export interface StatusHistoryEntry {
  status: PickupStatus;
  changedBy: string | User;
  changedAt: string;
  note?: string;
}

export interface Pickup {
  _id: string;
  requestId: string | DonationRequest;
  volunteerId: string | Volunteer;
  pickupDate: string;
  pickupTime: string;
  pickupStatus: PickupStatus;
  statusHistory: StatusHistoryEntry[];
  notes?: string;
  distribution?: Distribution;
  createdAt: string;
}

export interface Distribution {
  _id: string;
  pickupId: string | Pickup;
  ngoId: string | NGO;
  distributionDate: string;
  quantityDistributed: number;
  beneficiaryCount: number;
  distributionStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalDonors: number;
  totalNgos: number;
  totalVolunteers: number;
  totalDonations: number;
  availableDonations: number;
  foodRescued: number;
  activePicups: number;
  completedDistributions: number;
  peopleServed: number;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  userType: UserType;
  donorProfile?: Donor;
  ngoProfile?: NGO;
  volunteerProfile?: Volunteer;
}
