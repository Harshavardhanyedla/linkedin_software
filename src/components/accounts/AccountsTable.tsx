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
import { MoreHorizontal, CreditCard, ShieldAlert, CheckCircle, Trash2, ExternalLink, Mail, Edit2 } from 'lucide-react';
import { Account } from '@/types';
import { format, differenceInDays, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface AccountsTableProps {
  accounts: Account[];
  onMarkPaid: (id: string) => void;
  onEdit: (account: Account) => void;
  onMarkRestricted: (account: Account) => void;
  onMarkActive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AccountsTable({ 
  accounts, 
  onMarkPaid, 
  onEdit,
  onMarkRestricted, 
  onMarkActive, 
  onDelete 
}: AccountsTableProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wider">Active</Badge>;
      case 'Restricted':
        return <Badge className="bg-amber-500/10 text-amber-500 border-none px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wider">Restricted</Badge>;
      case 'Overdue':
        return <Badge className="bg-rose-500/10 text-rose-500 border-none px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wider animate-pulse">Overdue</Badge>;
      default:
        return <Badge variant="outline" className="px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wider">{status}</Badge>;
    }
  };

  const getDaysRemaining = (date: string) => {
    const today = new Date();
    const paymentDate = parseISO(date);
    const diff = differenceInDays(paymentDate, today);
    
    if (diff < 0) return <span className="text-rose-500 font-bold bg-rose-500/5 px-2 py-1 rounded-md text-xs">{Math.abs(diff)} days past due</span>;
    if (diff === 0) return <span className="text-amber-500 font-bold bg-amber-500/5 px-2 py-1 rounded-md text-xs">Due Today</span>;
    if (diff <= 3) return <span className="text-amber-400 font-bold bg-amber-400/5 px-2 py-1 rounded-md text-xs">In {diff} days</span>;
    return <span className="text-muted-foreground text-xs">{diff} days left</span>;
  };

  return (
    <div className="rounded-2xl glass overflow-hidden border-none shadow-2xl">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="font-bold text-xs uppercase tracking-widest py-5 pl-6 text-muted-foreground/70">Account Email</TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-widest py-5 text-muted-foreground/70">Status</TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-widest py-5 text-muted-foreground/70">Payment Date</TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-widest py-5 text-muted-foreground/70">Timeline</TableHead>
            <TableHead className="text-right font-bold text-xs uppercase tracking-widest py-5 pr-6 text-muted-foreground/70">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {accounts.map((account) => (
              <motion.tr 
                key={account.id} 
                className="group hover:bg-primary/[0.03] transition-colors border-b border-border/20 last:border-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                layout
              >
                <TableCell className="font-semibold py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary/40 group-hover:bg-primary/10 group-hover:text-primary/70 transition-colors">
                        <Mail size={16} />
                      </div>
                      <span className="truncate max-w-[200px] lg:max-w-xs">{account.email}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={12} />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">{getStatusBadge(account.status)}</TableCell>
                  <TableCell className="py-4">
                    <span className="font-medium text-sm">
                      {format(parseISO(account.payment_date), 'MMM dd, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">{getDaysRemaining(account.payment_date)}</TableCell>
                  <TableCell className="text-right py-4 pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-9 w-9 rounded-xl hover:bg-primary/10 flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <MoreHorizontal size={18} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 glass border-border/20 p-1.5 shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-2 py-1.5">Manage Account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/10" />
                        <DropdownMenuItem className="rounded-lg py-2 focus:bg-primary/5" onClick={() => onMarkPaid(account.id)}>
                          <CreditCard size={15} className="mr-3 text-emerald-500" />
                          <span className="font-medium">Mark as Paid</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg py-2 focus:bg-primary/5" onClick={() => onEdit(account)}>
                          <Edit2 size={15} className="mr-3 text-blue-500" />
                          <span className="font-medium">Edit Account</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg py-2 focus:bg-primary/5" onClick={() => onMarkRestricted(account)}>
                          <ShieldAlert size={15} className="mr-3 text-amber-500" />
                          <span className="font-medium">Report Restriction</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg py-2 focus:bg-primary/5" onClick={() => onMarkActive(account.id)}>
                          <CheckCircle size={15} className="mr-3 text-blue-500" />
                          <span className="font-medium">Set to Active</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/10" />
                        <DropdownMenuItem 
                          className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/5 rounded-lg py-2" 
                          onClick={() => onDelete(account.id)}
                        >
                          <Trash2 size={15} className="mr-3" />
                          <span className="font-medium">Delete Account</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
            ))}
          </AnimatePresence>
          {accounts.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="h-64 text-center">
                <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                  <Mail size={48} className="mb-2" />
                  <p className="text-lg font-bold">No accounts found</p>
                  <p className="text-sm max-w-xs mx-auto">Your account list is empty. Add your first LinkedIn account to start tracking.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
