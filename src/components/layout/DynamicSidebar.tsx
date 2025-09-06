"use client";

import { useUser } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import Sidebar from './Sidebar';
import type { SidebarItem } from './Sidebar';
import {
  Home,
  User,
  Settings,
  HelpCircle,
  LayoutDashboard,
  Building2,
} from "lucide-react";

export default function DynamicSidebar() {
  const { user, isSignedIn } = useUser();
  const t = useTranslations('common');
  
  // Defensive guard: if used outside <SignedIn>, avoid rendering
  if (!isSignedIn) return null;
  
  const baseItems: SidebarItem[] = [
    {
      name: t('home'),
      href: '/',
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: t('dashboard'),
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: t('users'),
      href: '/users',
      icon: <User className="h-5 w-5" />,
    },
  ];
  
  const merchantItems: SidebarItem[] = [
    {
      name: t('organization'),
      href: '/organizations',
      icon: <Building2 className="h-5 w-5" />,
    },
  ];
  
  const endItems: SidebarItem[] = [
    {
      name: t('settings'),
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
    },
    {
      name: t('help'),
      href: '/help',
      icon: <HelpCircle className="h-5 w-5" />,
    },
  ];
  
  const isMerchant = user?.unsafeMetadata?.role === 'merchant';
  
  const sidebarItems = [
    ...baseItems,
    ...(isMerchant ? merchantItems : []),
    ...endItems,
  ];
  
  return <Sidebar sidebarItems={sidebarItems} />;
}
