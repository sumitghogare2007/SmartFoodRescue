import { Badge } from '../ui/Badge';

export type DonationStatus = 'Available' | 'Requested' | 'Accepted' | 'Assigned' | 'Picked Up' | 'Delivered' | 'Distributed' | 'Expired' | 'Cancelled';

export interface Props {
  status: DonationStatus;
}

export function DonationStatusBadge({ status }: Props) {
  const variants: Record<string, "green" | "amber" | "red" | "blue" | "gray" | "purple" | "teal" | "indigo"> = {
    'Available': 'green',
    'Requested': 'blue',
    'Accepted': 'teal',
    'Assigned': 'purple',
    'Picked Up': 'amber',
    'Delivered': 'indigo',
    'Distributed': 'green',
    'Expired': 'gray',
    'Cancelled': 'red'
  };

  return (
    <Badge variant={variants[status] || 'gray'}>
      {status}
    </Badge>
  );
}
