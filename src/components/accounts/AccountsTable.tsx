'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, CreditCard, ShieldAlert, CheckCircle, Trash2, ExternalLink } from 'lucide-react';
import { Account } from '@/types';
import { format, differenceInDays, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface AccountsTableProps {
  accounts: Account[];
  onMarkPaid: (id: string) => void;
  onMarkRestricted: (account: Account) => void;
  onMarkActive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AccountsTable({ 
  accounts, 
  onMarkPaid, 
  onMarkRestricted, 
  onMarkActive, 
  onDelete 
}: AccountsTableProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-none">Active</Badge>;
      case 'Restricted':
        return <Badge className="bg-amber-500/10 text-amber-500 border-none">Restricted</Badge>;
      case 'Overdue':
        return <Badge className="bg-rose-500/10 text-rose-500 border-none">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDaysRemaining = (date: string) => {
    const today = new Date();
    const paymentDate = parseISO(date);
    const diff = differenceInDays(paymentDate, today);
    
    if (diff < 0) return <span className="text-rose-500 font-medium">Overdue ({Math.abs(diff)} days)</span>;
    if (diff === 0) return <span className="text-amber-500 font-medium">Due Today</span>;
    return <span className="text-muted-foreground">{diff} days remaining</span>;
  };

  return (
    <div className="rounded-xl border bg-background/50 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-semibold">Account Email</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Payment Date</TableHead>
            <TableHead className="font-semibold">Timeline</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {accounts.map((account) => (
              <motion.tr 
                key={account.id} 
                className="group hover:bg-muted/30 transition-colors border-b last:border-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                layout
              >
                <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {account.email}
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={12} />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell>{format(parseISO(account.payment_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{getDaysRemaining(account.payment_date)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger 
                        render={
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={16} />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onMarkPaid(account.id)}>
                          <CreditCard size={14} className="mr-2 text-emerald-500" />
                          Mark Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onMarkRestricted(account)}>
                          <ShieldAlert size={14} className="mr-2 text-amber-500" />
                          Mark Restricted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onMarkActive(account.id)}>
                          <CheckCircle size={14} className="mr-2 text-blue-500" />
                          Mark Active
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-rose-500 focus:text-rose-500" 
                          onClick={() => onDelete(account.id)}
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
            ))}
          </AnimatePresence>
          {accounts.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                No accounts found. Add your first account to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
