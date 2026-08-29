-- Supabase Database Schema & Row Level Security Policies for Sentinel / FraudShield AI
-- Table: transactions

CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'U0001',
    user_name TEXT NOT NULL DEFAULT 'Current User',
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    merchant_category TEXT NOT NULL,
    merchant_url TEXT,
    location TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    fraud_probability NUMERIC NOT NULL,
    prediction TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    status TEXT NOT NULL,
    account_age INTEGER NOT NULL DEFAULT 0,
    previous_transaction_amount NUMERIC NOT NULL DEFAULT 0,
    transaction_frequency INTEGER NOT NULL DEFAULT 0,
    previous_fraud_count INTEGER NOT NULL DEFAULT 0,
    distance_from_previous NUMERIC NOT NULL DEFAULT 0,
    device_type TEXT NOT NULL DEFAULT 'Mobile',
    ip_risk_score INTEGER NOT NULL DEFAULT 0,
    risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: Allow client application read access to transaction records
CREATE POLICY "Allow read access to transactions" 
ON public.transactions 
FOR SELECT 
USING (true);

-- 2. Insert Policy: Allow client application to record analyzed transactions
CREATE POLICY "Allow insert access to transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (
    risk_score >= 0 AND risk_score <= 100 AND
    amount >= 0
);

-- 3. Note on UPDATE and DELETE:
-- Public UPDATE and DELETE permissions are omitted by default to prevent client-side tampering 
-- of risk scores, fraud predictions, and transaction logs once recorded.
