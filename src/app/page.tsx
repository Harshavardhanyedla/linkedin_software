'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { AccountsTable } from '@/components/accounts/AccountsTable';
import { AddAccountModal } from '@/components/accounts/AddAccountModal';
import { RestrictionModal } from '@/components/accounts/RestrictionModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Download, Search, Filter, RefreshCcw, Loader2, Bell, AlertTriangle, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Account, DashboardStats } from '@/types';
import { toast } from 'sonner';
import { addMonths, format, isAfter, isBefore, parseISO, startOfDay, addDays } from 'date-fns';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    upcomingPayments: 0,
    overdueAccounts: 0,
    restrictedAccounts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRestrictModalOpen, setIsRestrictModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  const supabase = createClient();

  const fetchAccounts = useCallback(async () => {
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
      const updatedAccounts = formattedAccounts.map(acc => {
        const paymentDate = parseISO(acc.payment_date);
        if (isBefore(paymentDate, today) && acc.status === 'Active') {
          return { ...acc, status: 'Overdue' as const };
        }
        return acc;
      });

      setAccounts(updatedAccounts);
      calculateStats(updatedAccounts);
    } catch (error: any) {
      toast.error('Failed to fetch accounts');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const calculateStats = (data: Account[]) => {
    const today = startOfDay(new Date());
    const nextWeek = addDays(today, 7);

    setStats({
      totalAccounts: data.length,
      upcomingPayments: data.filter(acc => {
        const date = parseISO(acc.payment_date);
        return (isAfter(date, today) || date.getTime() === today.getTime()) && isBefore(date, nextWeek);
      }).length,
      overdueAccounts: data.filter(acc => acc.status === 'Overdue').length,
      restrictedAccounts: data.filter(acc => acc.status === 'Restricted').length,
    });
  };

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleMarkPaid = async (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;

    try {
      const oldDate = account.payment_date;
      const newDate = format(addMonths(parseISO(oldDate), 1), 'yyyy-MM-dd');

      const { error: accError } = await supabase
        .from('accounts')
        .update({
          payment_date: newDate,
          status: 'Active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (accError) throw accError;

      await supabase.from('payment_history').insert({
        account_id: id,
        old_payment_date: oldDate,
        new_payment_date: newDate,
      });

      toast.success('Payment recorded successfully');
      fetchAccounts();
    } catch (error: any) {
      toast.error('Failed to mark as paid');
    }
  };

  const handleMarkRestricted = (account: Account) => {
    setSelectedAccount(account);
    setIsRestrictModalOpen(true);
  };

  const handleMarkActive = async (id: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ status: 'Active', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success('Account marked as Active');
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Account deleted');
      fetchAccounts();
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
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">
            Manage your LinkedIn rental accounts and track payment cycles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportToExcel} className="hidden sm:flex border-none bg-secondary/50">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="shadow-lg shadow-primary/20 font-semibold px-6">
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
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
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={fetchAccounts} disabled={isLoading} className="rounded-full">
                <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 w-full bg-muted/50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <AccountsTable 
              accounts={filteredAccounts}
              onMarkPaid={handleMarkPaid}
              onMarkRestricted={handleMarkRestricted}
              onMarkActive={handleMarkActive}
              onDelete={handleDelete}
            />
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-background/50 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Bell size={18} className="text-primary" />
                  Reminders
                </CardTitle>
                {notifications.length > 0 && (
                  <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {notifications.length > 0 ? (
                  notifications.map((note, idx) => (
                    <motion.div
                      key={`${note.email}-${note.type}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-3 rounded-lg bg-secondary/30 border border-secondary flex gap-3 items-start"
                    >
                      <div className={`mt-0.5 p-1 rounded ${
                        note.type === 'overdue' ? 'bg-rose-500/20 text-rose-500' :
                        note.type === 'today' ? 'bg-amber-500/20 text-amber-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        <AlertTriangle size={14} />
                      </div>
                      <p className="text-xs font-medium leading-relaxed">{note.message}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">No urgent reminders. You're all caught up!</p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card className="border-none bg-primary/5 backdrop-blur-sm shadow-xl overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Shield size={80} />
             </div>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Secure Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All account data is encrypted and stored securely in your private Supabase instance.
                Restriction calculations are performed server-side for maximum accuracy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddAccountModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchAccounts}
      />

      <RestrictionModal 
        account={selectedAccount}
        isOpen={isRestrictModalOpen}
        onClose={() => setIsRestrictModalOpen(false)}
        onSuccess={fetchAccounts}
      />
    </div>
  );
}
