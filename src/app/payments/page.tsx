'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Account } from '@/types';
import { format, isBefore, isAfter, parseISO, startOfDay, addDays } from 'date-fns';
import { CreditCard, Calendar, Clock, AlertCircle, Loader2, ChevronRight, Check } from 'lucide-react';
import { addMonths } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function PaymentsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('payment_date', { ascending: true });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);
  
  const handleMarkPaid = async (account: Account) => {
    try {
      const nextDate = format(addMonths(parseISO(account.payment_date), 1), 'yyyy-MM-dd');
      
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ 
          payment_date: nextDate,
          status: 'Active' // Reset status if it was overdue
        })
        .eq('id', account.id);

      if (updateError) throw updateError;

      // Log to payment history
      await supabase.from('payment_history').insert({
        account_id: account.id,
        amount: 0, // Optional: could add an amount field if needed
        payment_date: new Date().toISOString(),
        notes: 'Monthly payment completed'
      });

      toast.success(`Payment confirmed for ${account.email}`);
      fetchAccounts();
    } catch (error) {
      console.error(error);
      toast.error('Failed to process payment');
    }
  };

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  const overdue = accounts.filter(acc => isBefore(parseISO(acc.payment_date), today));
  const dueToday = accounts.filter(acc => parseISO(acc.payment_date).getTime() === today.getTime());
  const dueTomorrow = accounts.filter(acc => parseISO(acc.payment_date).getTime() === tomorrow.getTime());
  const dueThisWeek = accounts.filter(acc => {
    const date = parseISO(acc.payment_date);
    return isAfter(date, tomorrow) && isBefore(date, nextWeek);
  });

  const PaymentCard = ({ account, status }: { account: Account, status: 'today' | 'tomorrow' | 'week' | 'overdue' }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background/50 border-none shadow-sm rounded-xl p-4 flex items-center justify-between hover:bg-secondary/20 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${
          status === 'today' ? 'bg-amber-500/10 text-amber-500' : 
          status === 'overdue' ? 'bg-rose-500/10 text-rose-500' : 
          status === 'tomorrow' ? 'bg-blue-500/10 text-blue-500' :
          'bg-emerald-500/10 text-emerald-500'
        }`}>
          {status === 'today' ? <Clock size={20} /> : status === 'overdue' ? <AlertCircle size={20} /> : <Calendar size={20} />}
        </div>
        <div>
          <p className="font-semibold group-hover:text-primary transition-colors">{account.email}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar size={12} />
            {format(parseISO(account.payment_date), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {status === 'overdue' && <Badge variant="destructive" className="animate-pulse">Overdue</Badge>}
        {status === 'today' && <Badge className="bg-amber-500 border-none text-white">Due Today</Badge>}
        {status === 'tomorrow' && <Badge className="bg-blue-500 border-none text-white">Due Tomorrow</Badge>}
        
        <Button 
          size="sm" 
          onClick={() => handleMarkPaid(account)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white border-none h-8 px-3 text-xs font-semibold"
        >
          <Check size={14} className="mr-1.5" />
          Mark Paid
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Timeline</h1>
          <p className="text-muted-foreground mt-1">
            Visual breakdown of all upcoming and pending LinkedIn account payments.
          </p>
        </div>
        <div className="bg-primary/10 p-3 rounded-2xl">
          <CreditCard className="text-primary" size={24} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          <p className="text-muted-foreground text-sm font-medium">Syncing payment records...</p>
        </div>
      ) : (
        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Overdue
              <span className="text-xs font-normal">({overdue.length})</span>
            </h2>
            <div className="grid gap-3">
              {overdue.map(acc => <PaymentCard key={acc.id} account={acc} status="overdue" />)}
              {overdue.length === 0 && (
                <div className="py-4 px-6 border border-dashed rounded-xl text-center text-sm text-muted-foreground">
                  No overdue payments.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Due Today
              <span className="text-xs font-normal">({dueToday.length})</span>
            </h2>
            <div className="grid gap-3">
              {dueToday.map(acc => <PaymentCard key={acc.id} account={acc} status="today" />)}
              {dueToday.length === 0 && (
                <div className="py-4 px-6 border border-dashed rounded-xl text-center text-sm text-muted-foreground">
                  No payments due today.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Due Tomorrow
              <span className="text-xs font-normal">({dueTomorrow.length})</span>
            </h2>
            <div className="grid gap-3">
              {dueTomorrow.map(acc => <PaymentCard key={acc.id} account={acc} status="tomorrow" />)}
              {dueTomorrow.length === 0 && (
                <div className="py-4 px-6 border border-dashed rounded-xl text-center text-sm text-muted-foreground">
                  No payments due tomorrow.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Next 7 Days
              <span className="text-xs font-normal">({dueThisWeek.length})</span>
            </h2>
            <div className="grid gap-3">
              {dueThisWeek.map(acc => <PaymentCard key={acc.id} account={acc} status="week" />)}
              {dueThisWeek.length === 0 && (
                <div className="py-4 px-6 border border-dashed rounded-xl text-center text-sm text-muted-foreground">
                  No other payments due this week.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
