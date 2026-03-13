import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://ymyhlpsezjbkgyzlawuq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteWhscHNlempia2d5emxhd3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDM1MjYsImV4cCI6MjA4ODc3OTUyNn0.WElsxEzfR5e2Yf-K6-Cgh7mAnOWvKoeSR7csMNa1plk"
);