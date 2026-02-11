-- Migration: Add editorial_tasks table for async editorial generation
-- Run this in your Supabase SQL Editor

-- Editorial tasks table (for async editorial pipeline processing)
CREATE TABLE IF NOT EXISTS public.editorial_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
  input JSONB,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for editorial_tasks
ALTER TABLE public.editorial_tasks ENABLE ROW LEVEL SECURITY;

-- Editorial tasks policies
DROP POLICY IF EXISTS "Users can view own editorial tasks" ON public.editorial_tasks;
CREATE POLICY "Users can view own editorial tasks" ON public.editorial_tasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own editorial tasks" ON public.editorial_tasks;
CREATE POLICY "Users can create own editorial tasks" ON public.editorial_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own editorial tasks" ON public.editorial_tasks;
CREATE POLICY "Users can update own editorial tasks" ON public.editorial_tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_editorial_tasks_updated_at ON public.editorial_tasks;
CREATE TRIGGER update_editorial_tasks_updated_at
  BEFORE UPDATE ON public.editorial_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_editorial_tasks_user_id ON public.editorial_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_editorial_tasks_status ON public.editorial_tasks(status);
