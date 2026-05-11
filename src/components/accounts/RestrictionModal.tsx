'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ShieldAlert } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Account } from '@/types';
import { addDays, differenceInDays, parseISO, format } from 'date-fns';

interface RestrictionModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RestrictionModal({ account, isOpen, onClose, onSuccess }: RestrictionModalProps) {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    setIsLoading(true);

    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const restrictedDays = differenceInDays(end, start);

      if (restrictedDays < 0) {
        throw new Error('End date must be after start date');
      }

      // 1. Record restriction
      const { error: restrictionError } = await supabase.from('restrictions').insert({
        account_id: account.id,
        restriction_start: startDate,
        restriction_end: endDate,
        restricted_days: restrictedDays,
      });

      if (restrictionError) throw restrictionError;

      // 2. Calculate new payment date
      const currentPaymentDate = parseISO(account.payment_date);
      const newPaymentDate = addDays(currentPaymentDate, restrictedDays);
      const formattedNewDate = format(newPaymentDate, 'yyyy-MM-dd');

      // 3. Update account status and payment date
      const { error: accountError } = await supabase
        .from('accounts')
        .update({
          status: 'Restricted',
          payment_date: formattedNewDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id);

      if (accountError) throw accountError;

      toast.success(`Account marked restricted. Payment date extended by ${restrictedDays} days.`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to restrict account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] border-none shadow-2xl bg-background/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-amber-500" />
            Mark Account Restricted
          </DialogTitle>
          <DialogDescription>
            Record the restriction period. The payment date will be automatically extended.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Account</Label>
              <Input value={account?.email || ''} disabled className="bg-muted/50 border-none" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start-date">Restriction Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="bg-muted/50 border-none"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">Restriction End Date (Expected)</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="bg-muted/50 border-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
              Confirm Restriction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
