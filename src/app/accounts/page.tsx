'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AccountsTable } from '@/components/accounts/AccountsTable';
import { AddAccountModal } from '@/components/accounts/AddAccountModal';
import { EditAccountModal } from '@/components/accounts/EditAccountModal';
import { RestrictionModal } from '@/components/accounts/RestrictionModal';
import { Button } from '@/components/ui/button';
import { Plus, Search, RefreshCcw, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Account } from '@/types';
import { toast } from 'sonner';
import { addMonths, format, parseISO } from 'date-fns';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModalAccount, setEditModalAccount] = useState<Account | null>(null);
  const [restrictionModalAccount, setRestrictionModalAccount] = useState<Account | null>(null);
  
  const supabase = createClient();

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('email', { ascending: true });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      toast.error('Failed to fetch accounts');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleMarkPaid = async (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;

    try {
      const oldDate = account.payment_date;
      const newDate = format(addMonths(parseISO(oldDate), 1), 'yyyy-MM-dd');

      await supabase.from('accounts').update({
        payment_date: newDate,
        status: 'Active',
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      await supabase.from('payment_history').insert({
        account_id: id,
        amount: 0,
        payment_date: new Date().toISOString(),
        notes: `Auto-advanced from ${oldDate}`
      });

      toast.success('Payment recorded');
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleMarkActive = async (id: string) => {
    try {
      await supabase.from('accounts').update({ 
        status: 'Active', 
        updated_at: new Date().toISOString() 
      }).eq('id', id);
      toast.success('Account marked as Active');
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await supabase.from('accounts').delete().eq('id', id);
      toast.success('Account deleted');
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gradient">Accounts</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage all your LinkedIn accounts and payment schedules.
          </p>
        </div>
        <Button 
          size="lg"
          onClick={() => setIsAddModalOpen(true)} 
          className="shadow-lg shadow-primary/20 font-semibold px-8"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Account
        </Button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by email..." 
              className="pl-10 bg-background/50 border-none shadow-sm focus-visible:ring-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={fetchAccounts} className="rounded-full">
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 w-full bg-muted/30 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <AccountsTable 
            accounts={filteredAccounts}
            onMarkPaid={handleMarkPaid}
            onEdit={(acc) => setEditModalAccount(acc)}
            onMarkRestricted={(acc) => setRestrictionModalAccount(acc)}
            onMarkActive={handleMarkActive}
            onDelete={handleDelete}
          />
        )}
      </div>

      <AddAccountModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchAccounts}
      />

      {restrictionModalAccount && (
        <RestrictionModal 
          account={restrictionModalAccount}
          isOpen={!!restrictionModalAccount}
          onClose={() => setRestrictionModalAccount(null)}
          onSuccess={fetchAccounts}
        />
      )}

      {editModalAccount && (
        <EditAccountModal
          isOpen={!!editModalAccount}
          onClose={() => setEditModalAccount(null)}
          account={editModalAccount}
          onSuccess={fetchAccounts}
        />
      )}
    </div>
  );
}
