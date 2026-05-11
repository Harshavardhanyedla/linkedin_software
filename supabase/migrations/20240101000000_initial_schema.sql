-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  payment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Restrictions table
CREATE TABLE IF NOT EXISTS restrictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  restriction_start DATE NOT NULL,
  restriction_end DATE,
  restricted_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment History table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  old_payment_date DATE NOT NULL,
  new_payment_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Accounts policies
CREATE POLICY "Users can view their own accounts"
ON accounts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
ON accounts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
ON accounts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
ON accounts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Restrictions policies
CREATE POLICY "Users can view their own restrictions"
ON restrictions FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM accounts
  WHERE accounts.id = restrictions.account_id
  AND accounts.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own restrictions"
ON restrictions FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM accounts
  WHERE accounts.id = account_id
  AND accounts.user_id = auth.uid()
));

CREATE POLICY "Users can update their own restrictions"
ON restrictions FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM accounts
  WHERE accounts.id = restrictions.account_id
  AND accounts.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own restrictions"
ON restrictions FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM accounts
  WHERE accounts.id = restrictions.account_id
  AND accounts.user_id = auth.uid()
));

-- Payment History policies
CREATE POLICY "Users can view their own payment history"
ON payment_history FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM accounts
  WHERE accounts.id = payment_history.account_id
  AND accounts.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own payment history"
ON payment_history FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM accounts
  WHERE accounts.id = account_id
  AND accounts.user_id = auth.uid()
));
