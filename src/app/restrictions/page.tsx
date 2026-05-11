'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Restriction, Account } from '@/types';
import { format, parseISO } from 'date-fns';
import { ShieldAlert, History, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function RestrictionsPage() {
  const [restrictions, setRestrictions] = useState<(Restriction & { accounts: Account })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  const fetchRestrictions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('restrictions')
        .select('*, accounts(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestrictions(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchRestrictions();
  }, [fetchRestrictions]);

  const filteredRestrictions = restrictions.filter(r => 
    r.accounts?.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Restrictions History</h1>
        <p className="text-muted-foreground mt-1">
          Monitor account restrictions and the automatic payment date extensions.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by email..." 
            className="pl-9 bg-background/50 border-none shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="border-none bg-background/50 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Restriction Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Email</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days Extended</TableHead>
                  <TableHead>Recorded At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestrictions.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-medium">{res.accounts?.email}</TableCell>
                    <TableCell>{format(parseISO(res.restriction_start), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{res.restriction_end ? format(parseISO(res.restriction_end), 'MMM dd, yyyy') : 'Ongoing'}</TableCell>
                    <TableCell>
                      <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-none">
                        +{res.restricted_days || 0} days
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(parseISO(res.created_at), 'MMM dd, HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRestrictions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No restriction records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
