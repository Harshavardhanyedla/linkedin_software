'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  ShieldAlert,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Accounts', href: '/accounts', icon: Users },
  { name: 'History', href: '/history', icon: History },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Shield', href: '/restrictions', icon: ShieldAlert },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t z-50 px-2 h-16 flex items-center justify-between pb-safe">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
              isActive 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "p-1 rounded-lg transition-colors",
              isActive ? "bg-primary/10" : "transparent"
            )}>
              <Icon size={18} />
            </div>
            <span className="text-[9px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
