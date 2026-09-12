import {
  Bike,
  Compass,
  CreditCard,
  HeartPulse,
  Home,
  IdCard,
  MapPin,
  ShoppingBasket,
  Ticket,
  type LucideIcon
} from "lucide-react";

const categoryIcons: Record<string, LucideIcon> = {
  compass: Compass,
  culture: Ticket,
  finance: CreditCard,
  health: HeartPulse,
  home: Home,
  housing: Home,
  living: ShoppingBasket,
  residency: IdCard,
  spots: MapPin,
  start: Compass,
  transport: Bike
};

type GuideCategoryIconProps = {
  className?: string;
  name?: string | null;
  size?: number;
};

export function GuideCategoryIcon({ className, name, size = 22 }: GuideCategoryIconProps) {
  const Icon = categoryIcons[name ?? ""] ?? Compass;

  return <Icon aria-hidden className={className} focusable="false" size={size} strokeWidth={1.9} />;
}
