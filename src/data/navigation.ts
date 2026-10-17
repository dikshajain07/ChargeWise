import { BarChart3Icon, FlaskConicalIcon, GaugeIcon, RouteIcon, UserIcon, ZapIcon, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  auth?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
{ to: '/dashboard', label: 'Dashboard', icon: GaugeIcon, auth: true },
{ to: '/stations', label: 'Stations', icon: ZapIcon },
{ to: '/route', label: 'Route', icon: RouteIcon },
{ to: '/mission-control', label: 'Forecast', icon: BarChart3Icon },
{ to: '/sandbox', label: 'Sandbox', icon: FlaskConicalIcon },
{ to: '/profile', label: 'Profile', icon: UserIcon, auth: true }];