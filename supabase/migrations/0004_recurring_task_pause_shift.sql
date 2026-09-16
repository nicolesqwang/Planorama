-- Recurring Tasks: when a paused streak is resumed, the check-ins that fell
-- inside the paused window are dropped and the same number are tacked onto
-- the end instead, so a paused streak doesn't lose length or renumber the
-- days you already completed. These two columns track that bookkeeping.
--
-- paused_at:   the date the streak was paused on (null when not paused).
-- paused_days: cumulative "dead" days folded out of the schedule so far,
--              subtracted when computing total/current occurrence counts.

alter table daily_tasks add column if not exists paused_at date;
alter table daily_tasks add column if not exists paused_days integer not null default 0;
