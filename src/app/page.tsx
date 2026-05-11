'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { AccountsTable } from '@/components/accounts/AccountsTable';
import { AddAccountModal } from '@/components/accounts/AddAccountModal';
import { RestrictionModal } from '@/components/accounts/RestrictionModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Download, Search, RefreshCcw, Bell, AlertTriangle, Shield, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Account } from '@/types';
import { toast } from 'sonner';
import { addMonths, format, isAfter, isBefore, parseISO, startOfDay, addDays } from 'date-fns';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    restricted: 0,
    overdue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [restrictionModalAccount, setRestrictionModalAccount] = useState<Account | null>(null);
  
  const supabase = createClient();

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAccounts = (data || []).map((acc: any) => ({
        ...acc,
        status: acc.status as any,
      }));

      // Automatically update overdue status
      const today = startOfDay(new Date());
      const nextWeek = addDays(today, 7);
      
      const updatedAccounts = formattedAccounts.map(acc => {
        const paymentDate = parseISO(acc.payment_date);
        if (isBefore(paymentDate, today) && acc.status === 'Active') {
          return { ...acc, status: 'Overdue' as const };
        }
        return acc;
      });

      setAccounts(updatedAccounts);
      
      setStats({
        total: updatedAccounts.length,
        upcoming: updatedAccounts.filter(a => {
          const d = parseISO(a.payment_date);
          return (isAfter(d, today) || d.getTime() === today.getTime()) && isBefore(d, nextWeek);
        }).length,
        restricted: updatedAccounts.filter(a => a.status === 'Restricted').length,
        overdue: updatedAccounts.filter(a => a.status === 'Overdue').length
      });
    } catch (error: any) {
      toast.error('Failed to fetch dashboard data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleMarkPaid = async (id: string) => {
    try {
      const account = accounts.find(a => a.id === id);
      if (!account) return;

      const nextDate = format(addMonths(parseISO(account.payment_date), 1), 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('accounts')
        .update({ payment_date: nextDate, status: 'Active' })
        .eq('id', id);

      if (error) throw error;
      
      await supabase.from('payment_history').insert({
        account_id: id,
        amount: 0,
        payment_date: new Date().toISOString(),
        notes: 'Payment marked as paid'
      });

      toast.success('Payment updated successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  const handleMarkActive = async (id: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ status: 'Active' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Account status updated to Active');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Account deleted');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(accounts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Accounts");
    XLSX.writeFile(wb, `LinkedIn_Accounts_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Notifications Logic
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  
  const notifications = [
    ...accounts.filter(acc => acc.status === 'Overdue').map(acc => ({
      type: 'overdue',
      message: `Account ${acc.email} is overdue!`,
      email: acc.email
    })),
    ...accounts.filter(acc => parseISO(acc.payment_date).getTime() === today.getTime()).map(acc => ({
      type: 'today',
      message: `Payment due today for ${acc.email}`,
      email: acc.email
    })),
    ...accounts.filter(acc => parseISO(acc.payment_date).getTime() === tomorrow.getTime()).map(acc => ({
      type: 'tomorrow',
      message: `Payment due tomorrow for ${acc.email}`,
      email: acc.email
    })),
  ].slice(0, 5);

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-gradient">Dashboard Overview</h1>
          <p className="text-muted-foreground text-lg">
            Manage your LinkedIn rental accounts and track payment cycles effortlessly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportToExcel} className="hidden sm:flex border-none bg-secondary/50">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button 
            size="lg" 
            onClick={() => setIsAddModalOpen(true)}
            className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold px-8"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Account
          </Button>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by email..." 
                className="pl-9 bg-background/50 border-none shadow-sm focus-visible:ring-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={fetchDashboardData} disabled={isLoading} className="rounded-full">
              <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 w-full bg-muted/30 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <AccountsTable 
              accounts={filteredAccounts} 
              onMarkPaid={handleMarkPaid}
              onMarkRestricted={(acc) => setRestrictionModalAccount(acc)}
              onMarkActive={handleMarkActive}
              onDelete={handleDelete}
            />
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none glass-card shadow-2xl">
            <CardHeader className="pb-3 border-b border-border/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Bell size={18} className="text-primary" />
                  Live Reminders
                </CardTitle>
                {notifications.length > 0 && (
                  <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <AnimatePresence>
                {notifications.length > 0 ? (
                  notifications.map((note, idx) => (
                    <motion.div
                      key={`${note.email}-${note.type}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-2xl bg-secondary/20 border border-border/10 flex gap-4 items-start hover:bg-secondary/30 transition-colors"
                    >
                      <div className={`mt-0.5 p-2 rounded-xl ${
                        note.type === 'overdue' ? 'bg-rose-500/10 text-rose-500' :
                        note.type === 'today' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        <AlertTriangle size={16} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold leading-none">{note.type.toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground font-medium">{note.message}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 flex flex-col items-center gap-3 opacity-20">
                    <CheckCircle size={48} />
                    <p className="text-sm font-bold">No urgent reminders</p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card className="border-none bg-primary/5 shadow-2xl overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
               <Shield size={120} />
             </div>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Shield size={18} className="text-primary" />
                Security Hub
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Your data is safe. We use enterprise-grade encryption and isolated database instances to ensure your LinkedIn rental history is always secure and private.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddAccountModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchDashboardData}
      />

      {restrictionModalAccount && (
        <RestrictionModal
          isOpen={!!restrictionModalAccount}
          onClose={() => setRestrictionModalAccount(null)}
          account={restrictionModalAccount}
          onSuccess={fetchDashboardData}
        />
      )}
    </div>
  );
}

function CheckCircle({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
