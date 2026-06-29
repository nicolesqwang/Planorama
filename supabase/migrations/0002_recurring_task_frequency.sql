-- Recurring Tasks feature: adds a repeat interval on top of the existing
-- daily_tasks table. Run this in the Supabase SQL Editor before using the
-- new length/frequency picker — existing rows default to frequency_days = 1
-- (every day), which matches how they already behaved.

alter table daily_tasks add column if not exists frequency_days integer not null default 1;
