'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Account } from '@/types';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { History, Calendar, Search, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

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

  const filteredAccounts = accounts.filter(acc => 
    acc.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group accounts by month
  const groupedAccounts: { [key: string]: Account[] } = filteredAccounts.reduce((groups, account) => {
    const month = format(parseISO(account.created_at), 'MMMM yyyy');
    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(account);
    return groups;
  }, {} as { [key: string]: Account[] });

  const monthKeys = Object.keys(groupedAccounts);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account History</h1>
          <p className="text-muted-foreground">Track when each LinkedIn account was added to the system.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search accounts..." 
            className="pl-10 bg-muted/50 border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <History className="h-8 w-8 text-primary/50" />
          </motion.div>
        </div>
      ) : monthKeys.length === 0 ? (
        <Card className="border-dashed bg-transparent">
          <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <History size={48} className="mb-4 opacity-20" />
            <p>No account history found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {monthKeys.map((month) => (
            <section key={month} className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">{month}</h2>
                <div className="h-px flex-1 bg-border/50" />
                <Badge variant="outline" className="bg-muted/50">
                  {groupedAccounts[month].length} {groupedAccounts[month].length === 1 ? 'account' : 'accounts'}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {groupedAccounts[month].map((account) => (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      layout
                    >
                      <Card className="overflow-hidden border-none bg-muted/30 hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <UserPlus className="h-4 w-4 text-emerald-500" />
                                <span className="font-medium truncate max-w-[180px]">
                                  {account.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Added on {format(parseISO(account.created_at), 'MMM dd, yyyy')}</span>
                              </div>
                            </div>
                            <Badge variant={account.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] h-5">
                              {account.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
