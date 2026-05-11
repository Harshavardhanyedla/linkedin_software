'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Users, CreditCard, ShieldAlert, AlertCircle, ArrowUpRight } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    total: number;
    upcoming: number;
    restricted: number;
    overdue: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const items = [
    {
      title: 'Total Accounts',
      value: stats.total,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      description: 'Active LinkedIn rentals'
    },
    {
      title: 'Upcoming Payments',
      value: stats.upcoming,
      icon: CreditCard,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      description: 'Due in next 7 days'
    },
    {
      title: 'Restricted Accounts',
      value: stats.restricted,
      icon: ShieldAlert,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      description: 'Requires attention'
    },
    {
      title: 'Overdue Accounts',
      value: stats.overdue,
      icon: AlertCircle,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      description: 'Payment past due date'
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ y: -4 }}
          className="group"
        >
          <Card className="glass-card overflow-hidden relative border-none">
            <div className={`absolute top-0 right-0 w-24 h-24 ${item.bg} blur-3xl -mr-8 -mt-8 rounded-full opacity-50 group-hover:opacity-80 transition-opacity`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {item.title}
              </CardTitle>
              <div className={`${item.bg} ${item.color} p-2.5 rounded-xl transition-transform group-hover:scale-110`}>
                <item.icon size={22} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold tracking-tight">{item.value}</div>
                <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-0.5">
                  Live <ArrowUpRight size={10} className="text-emerald-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {item.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
