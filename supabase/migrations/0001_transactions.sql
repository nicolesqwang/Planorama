-- Finances feature: transactions table
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query > Run)
-- before using the Finances page — the app does not run migrations for you.

create extension if not exists pgcrypto;

create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount decimal not null,
  type text not null check (type in ('expense', 'income')),
  category text not null,
  description text,
  date text not null,
  created_at timestamptz default now()
);

alter table transactions enable row level security;

create policy "users manage own transactions" on transactions
  for all using (auth.uid() = user_id);

create index if not exists transactions_user_id_date_idx on transactions (user_id, date desc);
