export type AccountStatus = 'Active' | 'Restricted' | 'Overdue';

export interface Account {
  id: string;
  email: string;
  payment_date: string;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface Restriction {
  id: string;
  account_id: string;
  restriction_start: string;
  restriction_end: string | null;
  restricted_days: number | null;
  created_at: string;
}

export interface PaymentHistory {
  id: string;
  account_id: string;
  old_payment_date: string;
  new_payment_date: string;
  paid_at: string;
}

export interface DashboardStats {
  totalAccounts: number;
  upcomingPayments: number;
  overdueAccounts: number;
  restrictedAccounts: number;
}
