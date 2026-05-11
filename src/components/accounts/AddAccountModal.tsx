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
import { Loader2, Plus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { addMonths, format, parseISO } from 'date-fns';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAccountModal({ isOpen, onClose, onSuccess }: AddAccountModalProps) {
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const nextPaymentDate = format(addMonths(parseISO(startDate), 1), 'yyyy-MM-dd');

      const { error } = await supabase.from('accounts').insert({
        email,
        payment_date: nextPaymentDate,
        user_id: user.id,
        status: 'Active'
      });

      if (error) throw error;

      toast.success('Account added successfully');
      setEmail('');
      setStartDate('');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] border-none shadow-2xl bg-background/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Account</DialogTitle>
          <DialogDescription>
            Enter the details of the LinkedIn account you want to manage.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="account@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-muted/50 border-none"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start-date">Date of Addition (Start Date)</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="bg-muted/50 border-none"
              />
              <p className="text-[10px] text-muted-foreground">
                The first reminder will be set for the same date next month.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="font-semibold">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
