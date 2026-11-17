import {
  Banknote,
  Landmark,
  Package,
  PackageCheck,
  Plane,
  Ship,
  Smartphone,
  Truck,
} from 'lucide-react';

export function ServiceIcon({ name, className = 'w-5 h-5' }: { name?: string; className?: string }) {
  switch (name) {
    case 'Ship':
      return <Ship className={className} aria-hidden="true" />;
    case 'Plane':
      return <Plane className={className} aria-hidden="true" />;
    case 'PackageCheck':
      return <PackageCheck className={className} aria-hidden="true" />;
    case 'Truck':
      return <Truck className={className} aria-hidden="true" />;
    case 'Landmark':
      return <Landmark className={className} aria-hidden="true" />;
    case 'Smartphone':
      return <Smartphone className={className} aria-hidden="true" />;
    case 'Banknote':
      return <Banknote className={className} aria-hidden="true" />;
    default:
      return <Package className={className} aria-hidden="true" />;
  }
}
