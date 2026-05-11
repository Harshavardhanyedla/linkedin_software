'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Users, CreditCard, ShieldAlert, AlertCircle } from 'lucide-react';
import { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const items = [
    {
      title: 'Total Accounts',
      value: stats.totalAccounts,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Upcoming Payments',
      value: stats.upcomingPayments,
      icon: CreditCard,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Restricted Accounts',
      value: stats.restrictedAccounts,
      icon: ShieldAlert,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Overdue Accounts',
      value: stats.overdueAccounts,
      icon: AlertCircle,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="border-none shadow-sm bg-background/50 backdrop-blur-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <div className={`${item.bg} ${item.color} p-2 rounded-lg`}>
                <item.icon size={20} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
