-- Recurring Tasks feature: lets a recurring task be paused so it stops
-- being pushed into the daily Tasks list until the user resumes it.
-- Existing rows default to paused = false (unchanged behavior).

alter table daily_tasks add column if not exists paused boolean not null default false;
